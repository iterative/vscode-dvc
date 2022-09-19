import cloneDeep from 'lodash.clonedeep'
import omit from 'lodash.omit'
import isEqual from 'lodash.isequal'
import { TopLevelSpec } from 'vega-lite'
import {
  ColorScale,
  CheckpointPlotValues,
  CheckpointPlot,
  isImagePlot,
  ImagePlot,
  TemplatePlot,
  Plot,
  TemplatePlotEntry,
  TemplatePlotSection,
  PlotsType,
  PlotSize
} from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput,
  PlotsOutput,
  Value,
  ValueTree
} from '../../cli/dvc/reader'
import { extractColumns } from '../../experiments/columns/extract'
import {
  decodeColumn,
  appendColumnToPath
} from '../../experiments/columns/paths'
import { MetricOrParamColumns } from '../../experiments/webview/contract'
import { addToMapArray } from '../../util/map'
import { TemplateOrder } from '../paths/collect'
import { extendVegaSpec, isMultiViewPlot } from '../vega/util'
import { definedAndNonEmpty, splitMatchedOrdered } from '../../util/array'
import { shortenForLabel } from '../../util/string'

type CheckpointPlotAccumulator = {
  iterations: Record<string, number>
  plots: Map<string, CheckpointPlotValues>
}

const collectFromMetricsFile = (
  acc: CheckpointPlotAccumulator,
  name: string,
  iteration: number,
  key: string | undefined,
  value: Value | ValueTree,
  ancestors: string[] = []
) => {
  const pathArray = [...ancestors, key].filter(Boolean) as string[]

  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value as ValueTree)) {
      collectFromMetricsFile(
        acc,
        name,
        iteration,
        childKey,
        childValue,
        pathArray
      )
    }
    return
  }

  const path = appendColumnToPath(...pathArray)

  addToMapArray(acc.plots, path, { group: name, iteration, y: value })
}

type MetricsAndDetailsOrUndefined =
  | {
      checkpoint_parent: string | undefined
      checkpoint_tip: string | undefined
      metrics: MetricOrParamColumns | undefined
      queued: boolean | undefined
      running: boolean | undefined
    }
  | undefined

const transformExperimentData = (
  experimentFieldsOrError: ExperimentFieldsOrError
): MetricsAndDetailsOrUndefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const { checkpoint_tip, checkpoint_parent, queued, running } =
    experimentFields
  const { metrics } = extractColumns(experimentFields)

  return { checkpoint_parent, checkpoint_tip, metrics, queued, running }
}

type ValidData = {
  checkpoint_parent: string
  checkpoint_tip: string
  metrics: MetricOrParamColumns
  queued: boolean | undefined
  running: boolean | undefined
}

const isValid = (data: MetricsAndDetailsOrUndefined): data is ValidData =>
  !!(data?.checkpoint_tip && data?.checkpoint_parent && data?.metrics)

const collectFromMetrics = (
  acc: CheckpointPlotAccumulator,
  experimentName: string,
  iteration: number,
  metrics: MetricOrParamColumns
) => {
  for (const file of Object.keys(metrics)) {
    collectFromMetricsFile(
      acc,
      experimentName,
      iteration,
      undefined,
      metrics[file],
      [file]
    )
  }
}

const getLastIteration = (
  acc: CheckpointPlotAccumulator,
  checkpointParent: string
): number => acc.iterations[checkpointParent] || 0

const collectIteration = (
  acc: CheckpointPlotAccumulator,
  sha: string,
  checkpointParent: string
): number => {
  const iteration = getLastIteration(acc, checkpointParent) + 1
  acc.iterations[sha] = iteration
  return iteration
}

const linkModified = (
  acc: CheckpointPlotAccumulator,
  experimentName: string,
  checkpointTip: string,
  checkpointParent: string,
  parent: ExperimentFieldsOrError | undefined
) => {
  if (!parent) {
    return
  }

  const parentData = transformExperimentData(parent)
  if (!isValid(parentData) || parentData.checkpoint_tip === checkpointTip) {
    return
  }

  const lastIteration = getLastIteration(acc, checkpointParent)
  collectFromMetrics(acc, experimentName, lastIteration, parentData.metrics)
}

const collectFromExperimentsObject = (
  acc: CheckpointPlotAccumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
) => {
  for (const [sha, experimentData] of Object.entries(
    experimentsObject
  ).reverse()) {
    const data = transformExperimentData(experimentData)

    if (!isValid(data)) {
      continue
    }
    const {
      checkpoint_tip: checkpointTip,
      checkpoint_parent: checkpointParent,
      metrics
    } = data

    const experimentName = experimentsObject[checkpointTip].data?.name
    if (!experimentName) {
      continue
    }

    linkModified(
      acc,
      experimentName,
      checkpointTip,
      checkpointParent,
      experimentsObject[checkpointParent]
    )

    const iteration = collectIteration(acc, sha, checkpointParent)
    collectFromMetrics(acc, experimentName, iteration, metrics)
  }
}

export const collectCheckpointPlotsData = (
  data: ExperimentsOutput
): CheckpointPlot[] | undefined => {
  const acc = {
    iterations: {},
    plots: new Map<string, CheckpointPlotValues>()
  }

  for (const { baseline, ...experimentsObject } of Object.values(
    omit(data, 'workspace')
  )) {
    const branch = transformExperimentData(baseline)

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject)
    }
  }

  if (acc.plots.size === 0) {
    return
  }

  const plotsData: CheckpointPlot[] = []

  for (const [key, value] of acc.plots.entries()) {
    plotsData.push({ id: decodeColumn(key), values: value })
  }

  return plotsData
}

const isRunningInWorkspace = (experiment: ExperimentFieldsOrError) =>
  experiment.data?.executor === 'workspace'

const collectRunningFromBranch = (
  experimentsObject: ExperimentsBranchOutput
): string | undefined => {
  for (const [sha, experiment] of Object.entries(experimentsObject)) {
    if (isRunningInWorkspace(experiment)) {
      return shortenForLabel(sha)
    }
  }
}

export const collectWorkspaceRunningCheckpoint = (
  data: ExperimentsOutput,
  hasCheckpoints: boolean
): string | undefined => {
  if (!hasCheckpoints) {
    return
  }
  for (const experimentsObject of Object.values(omit(data, 'workspace'))) {
    const checkpointRunningInWorkspace =
      collectRunningFromBranch(experimentsObject)
    if (checkpointRunningInWorkspace) {
      return checkpointRunningInWorkspace
    }
  }
}

type MetricOrderAccumulator = {
  newOrder: string[]
  uncollectedMetrics: string[]
  remainingSelectedMetrics: string[]
}

const collectExistingOrder = (
  acc: MetricOrderAccumulator,
  existingMetricOrder: string[]
) => {
  for (const metric of existingMetricOrder) {
    const uncollectedIndex = acc.uncollectedMetrics.indexOf(metric)
    const remainingIndex = acc.remainingSelectedMetrics.indexOf(metric)
    if (uncollectedIndex === -1 || remainingIndex === -1) {
      continue
    }
    acc.uncollectedMetrics.splice(uncollectedIndex, 1)
    acc.remainingSelectedMetrics.splice(remainingIndex, 1)
    acc.newOrder.push(metric)
  }
}

const collectRemainingSelected = (acc: MetricOrderAccumulator) => {
  const [newOrder, uncollectedMetrics] = splitMatchedOrdered(
    acc.uncollectedMetrics,
    acc.remainingSelectedMetrics
  )

  acc.newOrder.push(...newOrder)
  acc.uncollectedMetrics = uncollectedMetrics
}

export const collectMetricOrder = (
  checkpointPlotData: CheckpointPlot[] | undefined,
  existingMetricOrder: string[],
  selectedMetrics: string[] = []
): string[] => {
  if (!definedAndNonEmpty(checkpointPlotData)) {
    return []
  }

  const acc: MetricOrderAccumulator = {
    newOrder: [],
    remainingSelectedMetrics: [...selectedMetrics],
    uncollectedMetrics: checkpointPlotData.map(({ id }) => id)
  }

  if (!definedAndNonEmpty(acc.remainingSelectedMetrics)) {
    return acc.uncollectedMetrics
  }

  collectExistingOrder(acc, existingMetricOrder)
  collectRemainingSelected(acc)

  return [...acc.newOrder, ...acc.uncollectedMetrics]
}

type RevisionPathData = { [path: string]: Record<string, unknown>[] }

export type RevisionData = {
  [label: string]: RevisionPathData
}

export type ComparisonData = {
  [label: string]: {
    [path: string]: ImagePlot
  }
}

export type CLIRevisionIdToLabel = { [shortSha: string]: string }

const collectImageData = (
  acc: ComparisonData,
  path: string,
  plot: ImagePlot,
  cliIdToLabel: CLIRevisionIdToLabel
) => {
  const rev = plot.revisions?.[0]
  if (!rev) {
    return
  }

  const label = cliIdToLabel[rev]

  if (!label) {
    return
  }

  if (!acc[label]) {
    acc[label] = {}
  }

  acc[label][path] = plot
}

const collectDatapoints = (
  acc: RevisionData,
  path: string,
  rev: string,
  values: Record<string, unknown>[] = []
) => {
  for (const value of values) {
    const dvc_data_version_info = (value?.dvc_data_version_info ||
      {}) as Record<string, unknown>
    const data: { rev: string } = {
      ...value,
      ...dvc_data_version_info,
      rev
    }

    ;(acc[rev][path] as unknown[]).push(data)
  }
}

const collectPlotData = (
  acc: RevisionData,
  path: string,
  plot: TemplatePlot,
  cliIdToLabel: CLIRevisionIdToLabel
) => {
  for (const id of plot.revisions || []) {
    const label = cliIdToLabel[id]
    if (!acc[label]) {
      acc[label] = {}
    }
    acc[label][path] = []

    collectDatapoints(acc, path, label, plot.datapoints?.[id])
  }
}

type DataAccumulator = {
  revisionData: RevisionData
  comparisonData: ComparisonData
}

const collectPathData = (
  acc: DataAccumulator,
  path: string,
  plots: Plot[],
  cliIdToLabel: CLIRevisionIdToLabel
) => {
  for (const plot of plots) {
    if (isImagePlot(plot)) {
      collectImageData(acc.comparisonData, path, plot, cliIdToLabel)
      continue
    }

    collectPlotData(acc.revisionData, path, plot, cliIdToLabel)
  }
}

export const collectData = (
  data: PlotsOutput,
  cliIdToLabel: CLIRevisionIdToLabel
): DataAccumulator => {
  const acc = {
    comparisonData: {},
    revisionData: {}
  } as DataAccumulator

  for (const [path, plots] of Object.entries(data)) {
    collectPathData(acc, path, plots, cliIdToLabel)
  }

  return acc
}

const collectMultiSource = (
  acc: Record<string, Record<string, unknown>[]>,
  path: string,
  plot: TemplatePlot
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  for (const value of Object.values(plot.datapoints || {}).flat()) {
    const dvc_data_version_info = {
      // eslint-disable-next-line unicorn/no-useless-fallback-in-spread
      ...(value?.dvc_data_version_info || {})
    } as Record<string, unknown>

    if (dvc_data_version_info.revision) {
      delete dvc_data_version_info.revision
    }

    if (!acc[path]) {
      acc[path] = []
    }

    if (!acc[path].some(obj => isEqual(obj, dvc_data_version_info))) {
      acc[path].push(dvc_data_version_info)
    }
  }
}

export const collectMultiSourceData = (
  data: PlotsOutput,
  acc: Record<string, Record<string, unknown>[]>
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  for (const [path, plots] of Object.entries(data)) {
    for (const plot of plots) {
      if (isImagePlot(plot)) {
        continue
      }

      collectMultiSource(acc, path, plot)
    }
  }

  return acc
}

const ShapeValues = ['square', 'circle', 'triangle'] as const
const StrokeDashValues = [
  [1, 0],
  [8, 8],
  [8, 4],
  [4, 4],
  [4, 2],
  [2, 1],
  [1, 1]
] as const

export type StrokeDashScale = {
  domain: string[]
  range: typeof StrokeDashValues[number][]
}

export type StrokeDash = { scale: StrokeDashScale } & { field: string }

export type ShapeScale = {
  domain: string[]
  range: typeof ShapeValues[number][]
}
export type Shape = { scale: ShapeScale } & { field: string }

export const collectMultiSourceKeys = (
  data: Record<string, { filename?: string; field?: string }[]>
): Record<
  string,
  {
    strokeDash: StrokeDash
    shape?: Shape
  }
  // eslint-disable-next-line sonarjs/cognitive-complexity
> => {
  const acc: Record<
    string,
    {
      strokeDash: StrokeDash
      shape?: Shape
    }
  > = {}

  for (const [path, values] of Object.entries(data)) {
    if (values.length <= 1) {
      continue
    }

    const valueAcc: { filename?: Set<string>; field?: Set<string> } = {}
    for (const value of values) {
      for (const [key, fun] of Object.entries(value)) {
        if (key !== 'filename' && key !== 'field') {
          continue
        }

        if (!valueAcc[key]) {
          valueAcc[key] = new Set()
        }

        ;(valueAcc[key] as Set<string>).add(fun as string)
      }
    }

    const same: string[] = []
    const different: { field: string; variations: number }[] = []

    for (const [field, variations] of Object.entries(valueAcc)) {
      if (variations.size === 1) {
        continue
      }
      if (variations.size === values.length) {
        same.push(field)
        continue
      }
      different.push({ field, variations: variations.size })
    }

    const expectedOrder: [string, string] = ['filename', 'field']

    different.sort(
      (
        { field: aField, variations: aVariations },
        { field: bField, variations: bVariations }
      ) =>
        aVariations === bVariations
          ? expectedOrder.indexOf(aField) - expectedOrder.indexOf(bField)
          : aVariations - bVariations
    )

    const strokeDashScale: StrokeDashScale = {
      domain: [],
      range: []
    }
    const shapeScale: ShapeScale = {
      domain: [],
      range: []
    }

    if (same.length > 0) {
      let idx = 0
      const field = new Set<string>()
      for (const available of values) {
        const domain: string[] = []

        if (same.includes('filename') && available.filename) {
          domain.push(available.filename)
          field.add('filename')
        }
        if (same.includes('field') && available.field) {
          domain.push(available.field)
          field.add('field')
        }
        strokeDashScale.domain.push(domain.join('::'))
        strokeDashScale.range.push(StrokeDashValues[idx])
        strokeDashScale.domain.sort()
        idx++
      }

      const [first] = field
      const fieldDef = field.size === 2 ? 'data' : first
      acc[path] = { strokeDash: { field: fieldDef, scale: strokeDashScale } }
    }

    if (different.length > 0 && strokeDashScale.domain.length === 0) {
      const filenameOrField = different.shift()
      let idx = 0
      const field = new Set<string>()
      if (filenameOrField?.field) {
        for (const value of valueAcc[
          filenameOrField.field as 'filename' | 'field'
        ] || []) {
          field.add(filenameOrField.field)
          strokeDashScale.domain.push(value)
          strokeDashScale.range.push(StrokeDashValues[idx])
          strokeDashScale.domain.sort()
          idx++
        }
        acc[path] = {
          strokeDash: { field: [...field].join('::'), scale: strokeDashScale }
        }
      }
    }
    if (different.length > 0) {
      const filenameOrField = different.shift()
      let idx = 0
      const shapeField = new Set<string>()
      if (filenameOrField?.field) {
        for (const value of valueAcc[
          filenameOrField.field as 'filename' | 'field'
        ] || []) {
          shapeField.add(filenameOrField.field)
          shapeScale.domain.push(value)
          shapeScale.domain.sort()
          shapeScale.range.push(ShapeValues[idx])
          idx++
        }
        acc[path] = {
          ...acc[path],
          shape: { field: [...shapeField].join('::'), scale: shapeScale }
        }
      }
    }
  }

  return acc
}

const collectWorkspaceRevisionData = (
  overwriteRevisionData: RevisionPathData
) => {
  const acc: RevisionPathData = {}

  for (const [path, values] of Object.entries(overwriteRevisionData)) {
    acc[path] = []
    for (const value of values) {
      acc[path].push({ ...value, rev: 'workspace' })
    }
  }

  return acc
}

export const collectWorkspaceRaceConditionData = (
  runningSelectedCheckpoint: string | undefined,
  comparisonData: ComparisonData,
  revisionData: RevisionData
): {
  overwriteComparisonData: ComparisonData
  overwriteRevisionData: RevisionData
} => {
  if (!runningSelectedCheckpoint) {
    return { overwriteComparisonData: {}, overwriteRevisionData: {} }
  }

  const overwriteComparisonData = cloneDeep(
    comparisonData[runningSelectedCheckpoint]
  )
  const overwriteRevisionData = cloneDeep(
    revisionData[runningSelectedCheckpoint]
  )

  if (!overwriteComparisonData && !overwriteRevisionData) {
    return { overwriteComparisonData: {}, overwriteRevisionData: {} }
  }

  const workspaceRevisionData = collectWorkspaceRevisionData(
    overwriteRevisionData
  )

  return {
    overwriteComparisonData: { workspace: overwriteComparisonData },
    overwriteRevisionData: { workspace: workspaceRevisionData }
  }
}

export type TemplateAccumulator = { [path: string]: string }

const collectTemplate = (
  acc: TemplateAccumulator,
  path: string,
  plot: Plot
) => {
  if (isImagePlot(plot) || acc[path]) {
    return
  }
  const template = JSON.stringify(plot.content)
  acc[path] = template
}

export const collectTemplates = (data: PlotsOutput): TemplateAccumulator => {
  const acc: TemplateAccumulator = {}

  for (const [path, plots] of Object.entries(data)) {
    for (const plot of plots) {
      collectTemplate(acc, path, plot)
    }
  }

  return acc
}

const fillTemplate = (
  template: string,
  datapoints: unknown[],
  field?: string
) =>
  JSON.parse(
    template.replace(
      '"<DVC_METRIC_DATA>"',
      JSON.stringify(
        datapoints.map(data => {
          if (field !== 'data') {
            return data
          }
          const obj = data as Record<string, unknown>
          return {
            ...obj,
            data: [obj.filename, obj.field].join('::')
          }
        })
      )
    )
  ) as TopLevelSpec

const collectTemplateGroup = (
  paths: string[],
  selectedRevisions: string[],
  templates: TemplateAccumulator,
  revisionData: RevisionData,
  scales: Record<
    string,
    {
      strokeDash?: StrokeDash
      shape?: Shape
    }
  >,
  size: PlotSize,
  revisionColors: ColorScale | undefined
): TemplatePlotEntry[] => {
  const acc: TemplatePlotEntry[] = []
  for (const path of paths) {
    const template = templates[path]

    if (template) {
      const datapoints = selectedRevisions
        .flatMap(revision => revisionData?.[revision]?.[path])
        .filter(Boolean)

      const scale = scales[path] || {}

      const content = extendVegaSpec(
        fillTemplate(template, datapoints, scale.strokeDash?.field),
        size,
        {
          ...scale,
          color: revisionColors
        }
      )

      acc.push({
        content,
        id: path,
        multiView: isMultiViewPlot(content),
        revisions: selectedRevisions,
        type: PlotsType.VEGA
      })
    }
  }
  return acc
}

export const collectSelectedTemplatePlots = (
  order: TemplateOrder,
  selectedRevisions: string[],
  templates: TemplateAccumulator,
  revisionData: RevisionData,
  scales: Record<
    string,
    {
      strokeDash?: StrokeDash
      shape?: Shape
    }
  >,
  size: PlotSize,
  revisionColors: ColorScale | undefined
): TemplatePlotSection[] | undefined => {
  const acc: TemplatePlotSection[] = []
  for (const templateGroup of order) {
    const { paths, group } = templateGroup
    const entries = collectTemplateGroup(
      paths,
      selectedRevisions,
      templates,
      revisionData,
      scales,
      size,
      revisionColors
    )
    if (!definedAndNonEmpty(entries)) {
      continue
    }
    acc.push({
      entries,
      group
    })
  }
  return acc.length > 0 ? acc : undefined
}

export const collectBranchRevisionDetails = (
  branchShas: {
    id: string
    sha: string | undefined
  }[]
) => {
  const branchRevisions: Record<string, string> = {}
  for (const { id, sha } of branchShas) {
    if (sha) {
      branchRevisions[id] = shortenForLabel(sha)
    }
  }
  return branchRevisions
}
