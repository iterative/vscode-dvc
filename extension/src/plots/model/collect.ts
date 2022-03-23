import omit from 'lodash.omit'
import { VisualizationSpec } from 'react-vega'
import { TopLevelSpec } from 'vega-lite'
import {
  CheckpointPlotValues,
  CheckpointPlotData,
  isImagePlot,
  ImagePlot,
  TemplatePlot,
  Plot,
  TemplatePlotEntry,
  PlotSection,
  PlotsType
} from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentsOutput,
  PlotsOutput,
  Value,
  ValueTree
} from '../../cli/reader'
import { extractMetricsAndParams } from '../../experiments/metricsAndParams/extract'
import {
  decodeMetricOrParam,
  joinMetricOrParamFilePath
} from '../../experiments/metricsAndParams/paths'
import { MetricsOrParams } from '../../experiments/webview/contract'
import { addToMapArray } from '../../util/map'
import { TemplateOrder } from '../paths/collect'
import { ColorScale, extendVegaSpec, isMultiViewPlot } from '../vega/util'

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

  const path = joinMetricOrParamFilePath(...pathArray)

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

export type RevisionData = {
  [revision: string]: {
    [path: string]: unknown[]
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
  }
  for (const value of (plot.content.data as { values: { rev: string }[] })
    .values) {
    ;(acc[value.rev][path] as unknown[]).push(value)
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

type TemplateAccumulator = Record<string, VisualizationSpec>

const collectTemplate = (
  acc: TemplateAccumulator,
  path: string,
  plot: Plot
) => {
  if (isImagePlot(plot) || acc[path]) {
    return
  }
  const template = {
    ...plot.content
  }
  delete template.data
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
  template: VisualizationSpec,
  datapoints: unknown[],
  revisionColors: ColorScale | undefined
) =>
  extendVegaSpec(
    {
      ...template,
      data: {
        values: datapoints
      }
    } as TopLevelSpec,
    revisionColors
  )

const collectDatapoints = (
  path: string,
  selectedRevisions: string[],
  revisionData: RevisionData
): unknown[] =>
  selectedRevisions
    .flatMap(revision => revisionData?.[revision]?.[path])
    .filter(Boolean)

const collectTemplateGroup = (
  paths: string[],
  selectedRevisions: string[],
  templates: Record<string, VisualizationSpec>,
  revisionData: RevisionData,
  revisionColors: ColorScale | undefined
) => {
  const acc: TemplatePlotEntry[] = []
  for (const path of paths) {
    const template = templates[path]

    if (template) {
      const datapoints = collectDatapoints(
        path,
        selectedRevisions,
        revisionData
      )
      acc.push({
        content: fillTemplate(template, datapoints, revisionColors),
        id: `plot_${path}`,
        multiView: isMultiViewPlot(template),
        revisions: selectedRevisions,
        type: PlotsType.VEGA
      })
    }
  }
  return acc
}

export const collectTemplatePlots = (
  order: TemplateOrder,
  selectedRevisions: string[],
  templates: Record<string, VisualizationSpec>,
  revisionData: RevisionData,
  revisionColors: ColorScale | undefined
) => {
  const acc: PlotSection[] = []
  for (const templateGroup of order) {
    const { paths, group } = templateGroup
    acc.push({
      entries: collectTemplateGroup(
        paths,
        selectedRevisions,
        templates,
        revisionData,
        revisionColors
      ),
      group
    })
  }
  return acc
}
