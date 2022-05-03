import cloneDeep from 'lodash.clonedeep'
import omit from 'lodash.omit'
import { TopLevelSpec } from 'vega-lite'
import {
  ColorScale,
  CheckpointPlotValues,
  CheckpointPlotData,
  isImagePlot,
  ImagePlot,
  TemplatePlot,
  Plot,
  TemplatePlotEntry,
  TemplatePlotSection,
  PlotsType
} from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput,
  PlotsOutput,
  Value,
  ValueTree
} from '../../cli/reader'
import { extractMetricsAndParams } from '../../experiments/metricsAndParams/extract'
import {
  decodeMetricOrParam,
  appendMetricOrParamToPath
} from '../../experiments/metricsAndParams/paths'
import { MetricsOrParams } from '../../experiments/webview/contract'
import { addToMapArray } from '../../util/map'
import { TemplateOrder } from '../paths/collect'
import { extendVegaSpec, isMultiViewPlot } from '../vega/util'
import { definedAndNonEmpty, splitMatchedOrdered } from '../../util/array'
import { getShortSha } from '../../experiments/model/collect'

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

  const path = appendMetricOrParamToPath(...pathArray)

  addToMapArray(acc.plots, path, { group: name, iteration, y: value })
}

type MetricsAndDetailsOrUndefined =
  | {
      checkpoint_parent: string | undefined
      checkpoint_tip: string | undefined
      metrics: MetricsOrParams | undefined
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
  const { metrics } = extractMetricsAndParams(experimentFields)

  return { checkpoint_parent, checkpoint_tip, metrics, queued, running }
}

type ValidData = {
  checkpoint_parent: string
  checkpoint_tip: string
  metrics: MetricsOrParams
  queued: boolean | undefined
  running: boolean | undefined
}

const isValid = (data: MetricsAndDetailsOrUndefined): data is ValidData =>
  !!(data?.checkpoint_tip && data?.checkpoint_parent && data?.metrics)

const collectFromMetrics = (
  acc: CheckpointPlotAccumulator,
  experimentName: string,
  iteration: number,
  metrics: MetricsOrParams
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
): CheckpointPlotData[] | undefined => {
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

  const plotsData: CheckpointPlotData[] = []

  for (const [key, value] of acc.plots.entries()) {
    plotsData.push({ title: decodeMetricOrParam(key), values: value })
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
      return getShortSha(sha)
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
  checkpointPlotData: CheckpointPlotData[] | undefined,
  existingMetricOrder: string[],
  selectedMetrics: string[] = []
): string[] => {
  if (!definedAndNonEmpty(checkpointPlotData)) {
    return []
  }

  const acc: MetricOrderAccumulator = {
    newOrder: [],
    remainingSelectedMetrics: [...selectedMetrics],
    uncollectedMetrics: checkpointPlotData.map(({ title }) => title)
  }

  if (!definedAndNonEmpty(acc.remainingSelectedMetrics)) {
    return acc.uncollectedMetrics
  }

  collectExistingOrder(acc, existingMetricOrder)
  collectRemainingSelected(acc)

  return [...acc.newOrder, ...acc.uncollectedMetrics]
}

export type RevisionData = {
  [revision: string]: {
    [path: string]: Record<string, unknown>[]
  }
}

export type ComparisonData = {
  [revision: string]: {
    [path: string]: ImagePlot
  }
}

const collectImageData = (
  acc: ComparisonData,
  path: string,
  plot: ImagePlot
) => {
  const rev = plot.revisions?.[0]

  if (!rev) {
    return
  }

  if (!acc[rev]) {
    acc[rev] = {}
  }

  acc[rev][path] = plot
}

const collectDatapoints = (
  acc: RevisionData,
  path: string,
  rev: string,
  values: Record<string, unknown>[] = []
) => {
  for (const value of values) {
    ;(acc[rev][path] as unknown[]).push({ ...value, rev })
  }
}

const collectPlotData = (
  acc: RevisionData,
  path: string,
  plot: TemplatePlot
) => {
  for (const rev of plot.revisions || []) {
    if (!acc[rev]) {
      acc[rev] = {}
    }
    acc[rev][path] = []

    collectDatapoints(acc, path, rev, plot.datapoints?.[rev])
  }
}

type DataAccumulator = {
  revisionData: RevisionData
  comparisonData: ComparisonData
}

const collectPathData = (acc: DataAccumulator, path: string, plots: Plot[]) => {
  for (const plot of plots) {
    if (isImagePlot(plot)) {
      collectImageData(acc.comparisonData, path, plot)
      continue
    }

    collectPlotData(acc.revisionData, path, plot)
  }
}

export const collectData = (data: PlotsOutput): DataAccumulator => {
  const acc = {
    comparisonData: {},
    revisionData: {}
  } as DataAccumulator

  for (const [path, plots] of Object.entries(data)) {
    collectPathData(acc, path, plots)
  }

  return acc
}

const collectWorkspaceRevisionData = (overwriteRevisionData: {
  [path: string]: Record<string, unknown>[]
}) => {
  const acc: { [path: string]: Record<string, unknown>[] } = {}

  for (const [path, values] of Object.entries(overwriteRevisionData)) {
    acc[path] = []
    for (const value of values) {
      acc[path].push({ ...value, rev: 'workspace' })
    }
  }

  return acc
}

export const collectOverwriteWorkspaceData = (
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

  if (!overwriteComparisonData || !overwriteRevisionData) {
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

const fillTemplate = (template: string, datapoints: unknown[]) =>
  JSON.parse(
    template.replace('"<DVC_METRIC_DATA>"', JSON.stringify(datapoints))
  ) as TopLevelSpec

const collectTemplateGroup = (
  paths: string[],
  selectedRevisions: string[],
  templates: TemplateAccumulator,
  revisionData: RevisionData,
  revisionColors: ColorScale | undefined
): TemplatePlotEntry[] => {
  const acc: TemplatePlotEntry[] = []
  for (const path of paths) {
    const template = templates[path]

    if (template) {
      const datapoints = selectedRevisions
        .flatMap(revision => revisionData?.[revision]?.[path])
        .filter(Boolean)

      const content = extendVegaSpec(
        fillTemplate(template, datapoints),
        revisionColors
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
