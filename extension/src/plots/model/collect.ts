import omit from 'lodash.omit'
import get from 'lodash.get'
import { TopLevelSpec } from 'vega-lite'
import { VisualizationSpec } from 'react-vega'
import {
  CustomPlotsOrderValue,
  isCustomPlotOrderCheckpointValue
} from './custom'
import { getRevisionFirstThreeColumns } from './util'
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
  Revision,
  CustomPlotType,
  CustomPlot,
  MetricVsParamPlot
} from '../webview/contract'
import {
  EXPERIMENT_WORKSPACE_ID,
  ExperimentFieldsOrError,
  ExperimentsOutput,
  ExperimentStatus,
  isValueTree,
  PlotsOutput,
  Value,
  ValueTree
} from '../../cli/dvc/contract'
import { extractColumns } from '../../experiments/columns/extract'
import {
  decodeColumn,
  appendColumnToPath,
  splitColumnPath
} from '../../experiments/columns/paths'
import {
  ColumnType,
  Experiment,
  isRunning,
  MetricOrParamColumns
} from '../../experiments/webview/contract'
import { addToMapArray } from '../../util/map'
import { TemplateOrder } from '../paths/collect'
import { extendVegaSpec, isMultiViewPlot } from '../vega/util'
import { definedAndNonEmpty, reorderObjectList } from '../../util/array'
import { shortenForLabel } from '../../util/string'
import {
  getDvcDataVersionInfo,
  isConcatenatedField,
  mergeFields,
  MultiSourceEncoding,
  unmergeConcatenatedFields
} from '../multiSource/collect'
import { StrokeDashEncoding } from '../multiSource/constants'
import { SelectedExperimentWithColor } from '../../experiments/model'
import { Color } from '../../experiments/model/status/colors'
import { typedValueTreeEntries } from '../../experiments/columns/collect/metricsAndParams'

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

  if (isValueTree(value)) {
    for (const [childKey, childValue] of typedValueTreeEntries(value)) {
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
      status: ExperimentStatus | undefined
    }
  | undefined

const transformExperimentData = (
  experimentFieldsOrError: ExperimentFieldsOrError
): MetricsAndDetailsOrUndefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const { checkpoint_tip, checkpoint_parent, status } = experimentFields
  const { metrics } = extractColumns(experimentFields)

  return { checkpoint_parent, checkpoint_tip, metrics, status }
}

type ValidData = {
  checkpoint_parent: string
  checkpoint_tip: string
  metrics: MetricOrParamColumns
  status: ExperimentStatus
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
    omit(data, EXPERIMENT_WORKSPACE_ID)
  )) {
    const commit = transformExperimentData(baseline)

    if (commit) {
      collectFromExperimentsObject(acc, experimentsObject)
    }
  }

  if (acc.plots.size === 0) {
    return
  }

  const plotsData: CheckpointPlot[] = []

  for (const [key, value] of acc.plots.entries()) {
    plotsData.push({
      id: decodeColumn(key),
      metric: decodeColumn(key),
      type: CustomPlotType.CHECKPOINT,
      values: value
    })
  }

  return plotsData
}

export const getCustomPlotId = (plot: CustomPlotsOrderValue) =>
  plot.type === CustomPlotType.CHECKPOINT
    ? `custom-${plot.metric}`
    : `custom-${plot.metric}-${plot.param}`

export const collectCustomCheckpointPlotData = (
  data: ExperimentsOutput
): { [metric: string]: CheckpointPlot } => {
  const acc = {
    iterations: {},
    plots: new Map<string, CheckpointPlotValues>()
  }

  for (const { baseline, ...experimentsObject } of Object.values(
    omit(data, EXPERIMENT_WORKSPACE_ID)
  )) {
    const commit = transformExperimentData(baseline)

    if (commit) {
      collectFromExperimentsObject(acc, experimentsObject)
    }
  }

  const plotsData: { [metric: string]: CheckpointPlot } = {}
  if (acc.plots.size === 0) {
    return plotsData
  }

  for (const [key, value] of acc.plots.entries()) {
    const decodedMetric = decodeColumn(key)
    plotsData[decodedMetric] = {
      id: getCustomPlotId({
        metric: decodedMetric,
        type: CustomPlotType.CHECKPOINT
      }),
      metric: decodedMetric,
      type: CustomPlotType.CHECKPOINT,
      values: value
    }
  }

  return plotsData
}

export const isCheckpointPlot = (plot: CustomPlot): plot is CheckpointPlot => {
  return plot.type === CustomPlotType.CHECKPOINT
}

const collectMetricVsParamPlotData = (
  metric: string,
  param: string,
  experiments: Experiment[]
): MetricVsParamPlot => {
  const splitUpMetricPath = splitColumnPath(metric)
  const splitUpParamPath = splitColumnPath(param)
  const plotData: MetricVsParamPlot = {
    id: getCustomPlotId({
      metric,
      param,
      type: CustomPlotType.METRIC_VS_PARAM
    }),
    metric: metric.slice(ColumnType.METRICS.length + 1),
    param: param.slice(ColumnType.PARAMS.length + 1),
    type: CustomPlotType.METRIC_VS_PARAM,
    values: []
  }

  for (const experiment of experiments) {
    const metricValue = get(experiment, splitUpMetricPath) as number | undefined
    const paramValue = get(experiment, splitUpParamPath) as number | undefined

    if (metricValue !== undefined && paramValue !== undefined) {
      plotData.values.push({
        expName: experiment.name || experiment.label,
        metric: metricValue,
        param: paramValue
      })
    }
  }

  return plotData
}

// TBD it will probably be easier and/or faster to get the data from
// experiments vs the output...
export const collectCustomPlotsData = (
  plotsOrderValue: CustomPlotsOrderValue[],
  checkpointPlots: { [metric: string]: CheckpointPlot },
  experiments: Experiment[]
): CustomPlot[] => {
  return plotsOrderValue
    .map((plotOrderValue): CustomPlot => {
      if (isCustomPlotOrderCheckpointValue(plotOrderValue)) {
        const { metric } = plotOrderValue
        return checkpointPlots[metric.slice(ColumnType.METRICS.length + 1)]
      }
      const { metric, param } = plotOrderValue
      return collectMetricVsParamPlotData(metric, param, experiments)
    })
    .filter(Boolean)
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
    const dvc_data_version_info = getDvcDataVersionInfo(value)
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

const updateDatapoints = (
  path: string,
  revisionData: RevisionData,
  selectedRevisions: string[],
  key: string,
  fields: string[]
): unknown[] =>
  selectedRevisions
    .flatMap(revision => {
      const datapoints = revisionData?.[revision]?.[path] || []
      return datapoints.map(data => {
        const obj = data
        return {
          ...obj,
          [key]: mergeFields(fields.map(field => obj[field] as string))
        }
      })
    })
    .filter(Boolean)

const updateRevisions = (
  selectedRevisions: string[],
  domain: string[]
): string[] => {
  const revisions: string[] = []
  for (const revision of selectedRevisions) {
    for (const entry of domain) {
      revisions.push(mergeFields([revision, entry]))
    }
  }
  return revisions
}

const transformRevisionData = (
  path: string,
  selectedRevisions: string[],
  revisionData: RevisionData,
  isMultiView: boolean,
  multiSourceEncodingUpdate: { strokeDash: StrokeDashEncoding }
): { revisions: string[]; datapoints: unknown[] } => {
  const field = multiSourceEncodingUpdate.strokeDash?.field
  const isMultiSource = !!field
  const availableRevisions = selectedRevisions.filter(rev =>
    Object.keys(revisionData).includes(rev)
  )
  const transformNeeded =
    isMultiSource && (isMultiView || isConcatenatedField(field))

  if (!transformNeeded) {
    return {
      datapoints: selectedRevisions
        .flatMap(revision => revisionData?.[revision]?.[path])
        .filter(Boolean),
      revisions: availableRevisions
    }
  }

  const fields = unmergeConcatenatedFields(field)
  if (isMultiView) {
    fields.unshift('rev')
    return {
      datapoints: updateDatapoints(
        path,
        revisionData,
        availableRevisions,
        'rev',
        fields
      ),
      revisions: updateRevisions(
        availableRevisions,
        multiSourceEncodingUpdate.strokeDash.scale.domain
      )
    }
  }

  return {
    datapoints: updateDatapoints(
      path,
      revisionData,
      availableRevisions,
      field,
      fields
    ),
    revisions: availableRevisions
  }
}

const fillTemplate = (
  template: string,
  datapoints: unknown[]
): TopLevelSpec => {
  return JSON.parse(
    template.replace('"<DVC_METRIC_DATA>"', JSON.stringify(datapoints))
  ) as TopLevelSpec
}

const collectTemplatePlot = (
  acc: TemplatePlotEntry[],
  selectedRevisions: string[],
  path: string,
  template: string,
  revisionData: RevisionData,
  nbItemsPerRow: number,
  revisionColors: ColorScale | undefined,
  multiSourceEncoding: MultiSourceEncoding
) => {
  const isMultiView = isMultiViewPlot(
    JSON.parse(template) as TopLevelSpec | VisualizationSpec
  )
  const multiSourceEncodingUpdate = multiSourceEncoding[path] || {}
  const { datapoints, revisions } = transformRevisionData(
    path,
    selectedRevisions,
    revisionData,
    isMultiView,
    multiSourceEncodingUpdate
  )

  if (datapoints.length === 0) {
    return
  }

  const content = extendVegaSpec(
    fillTemplate(template, datapoints),
    nbItemsPerRow,
    {
      ...multiSourceEncodingUpdate,
      color: revisionColors
    }
  ) as VisualizationSpec

  acc.push({
    content,
    id: path,
    multiView: isMultiViewPlot(content),
    revisions,
    type: PlotsType.VEGA
  })
}

const collectTemplateGroup = (
  paths: string[],
  selectedRevisions: string[],
  templates: TemplateAccumulator,
  revisionData: RevisionData,
  nbItemsPerRow: number,
  revisionColors: ColorScale | undefined,
  multiSourceEncoding: MultiSourceEncoding
): TemplatePlotEntry[] => {
  const acc: TemplatePlotEntry[] = []
  for (const path of paths) {
    const template = templates[path]

    if (!template) {
      continue
    }

    collectTemplatePlot(
      acc,
      selectedRevisions,
      path,
      template,
      revisionData,
      nbItemsPerRow,
      revisionColors,
      multiSourceEncoding
    )
  }
  return acc
}

export const collectSelectedTemplatePlots = (
  order: TemplateOrder,
  selectedRevisions: string[],
  templates: TemplateAccumulator,
  revisionData: RevisionData,
  nbItemsPerRow: number,
  revisionColors: ColorScale | undefined,
  multiSourceEncoding: MultiSourceEncoding
): TemplatePlotSection[] | undefined => {
  const acc: TemplatePlotSection[] = []
  for (const templateGroup of order) {
    const { paths, group } = templateGroup
    const entries = collectTemplateGroup(
      paths,
      selectedRevisions,
      templates,
      revisionData,
      nbItemsPerRow,
      revisionColors,
      multiSourceEncoding
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

export const collectCommitRevisionDetails = (
  shas: {
    id: string
    sha: string | undefined
  }[]
) => {
  const commitRevisions: Record<string, string> = {}
  for (const { id, sha } of shas) {
    if (sha) {
      commitRevisions[id] = shortenForLabel(sha)
    }
  }
  return commitRevisions
}

const getRevision = (
  displayColor: Color,
  experiment: Experiment,
  firstThreeColumns: string[]
): Revision => {
  const { commit, displayNameOrParent, logicalGroupName, id, label } =
    experiment
  const revision: Revision = {
    displayColor,
    fetched: true,
    firstThreeColumns: getRevisionFirstThreeColumns(
      firstThreeColumns,
      experiment
    ),
    group: logicalGroupName,
    id,
    revision: label
  }
  if (commit) {
    revision.commit = displayNameOrParent
  }
  return revision
}

const overrideWithWorkspace = (
  orderMapping: { [label: string]: string },
  selectedWithOverrides: Revision[],
  displayColor: Color,
  label: string,
  firstThreeColumns: string[]
): void => {
  orderMapping[label] = EXPERIMENT_WORKSPACE_ID
  selectedWithOverrides.push(
    getRevision(
      displayColor,
      {
        id: EXPERIMENT_WORKSPACE_ID,
        label: EXPERIMENT_WORKSPACE_ID,
        logicalGroupName: undefined
      },
      firstThreeColumns
    )
  )
}

const isExperimentThatWillDisappearAtEnd = (
  { id, sha, checkpoint_tip }: Experiment,
  unfinishedRunningExperiments: { [id: string]: string }
): boolean => {
  const isCheckpointTip = sha === checkpoint_tip
  return (
    isCheckpointTip &&
    unfinishedRunningExperiments[id] !== EXPERIMENT_WORKSPACE_ID
  )
}

const getMostRecentFetchedCheckpointRevision = (
  selectedRevision: SelectedExperimentWithColor,
  fetchedRevs: Set<string>,
  checkpoints: Experiment[] | undefined,
  firstThreeColumns: string[]
): Revision => {
  const mostRecent =
    checkpoints?.find(({ label }) => fetchedRevs.has(label)) || selectedRevision
  return getRevision(
    selectedRevision.displayColor,
    mostRecent,
    firstThreeColumns
  )
}

const overrideRevisionDetail = (
  orderMapping: { [label: string]: string },
  selectedWithOverrides: Revision[],
  selectedRevision: SelectedExperimentWithColor,
  fetchedRevs: Set<string>,
  checkpoints: Experiment[] | undefined,
  firstThreeColumns: string[]
) => {
  const { label } = selectedRevision

  const mostRecent = getMostRecentFetchedCheckpointRevision(
    selectedRevision,
    fetchedRevs,
    checkpoints,
    firstThreeColumns
  )
  orderMapping[label] = mostRecent.revision
  selectedWithOverrides.push(mostRecent)
}

const collectRevisionDetail = (
  orderMapping: { [label: string]: string },
  selectedWithOverrides: Revision[],
  selectedRevision: SelectedExperimentWithColor,
  fetchedRevs: Set<string>,
  unfinishedRunningExperiments: { [id: string]: string },
  getCheckpoints: (id: string) => Experiment[] | undefined,
  firstThreeColumns: string[]
) => {
  const { label, status, id, displayColor } = selectedRevision

  if (
    !fetchedRevs.has(label) &&
    unfinishedRunningExperiments[id] === EXPERIMENT_WORKSPACE_ID
  ) {
    return overrideWithWorkspace(
      orderMapping,
      selectedWithOverrides,
      displayColor,
      label,
      firstThreeColumns
    )
  }

  if (
    !fetchedRevs.has(label) &&
    (isRunning(status) ||
      isExperimentThatWillDisappearAtEnd(
        selectedRevision,
        unfinishedRunningExperiments
      ))
  ) {
    return overrideRevisionDetail(
      orderMapping,
      selectedWithOverrides,
      selectedRevision,
      fetchedRevs,
      getCheckpoints(id),
      firstThreeColumns
    )
  }

  orderMapping[label] = label
  selectedWithOverrides.push(
    getRevision(displayColor, selectedRevision, firstThreeColumns)
  )
}

export const collectOverrideRevisionDetails = (
  comparisonOrder: string[],
  selectedRevisions: SelectedExperimentWithColor[],
  fetchedRevs: Set<string>,
  unfinishedRunningExperiments: { [id: string]: string },
  getCheckpoints: (id: string) => Experiment[] | undefined,
  firstThreeColumns: string[]
): {
  overrideComparison: Revision[]
  overrideRevisions: Revision[]
} => {
  const orderMapping: { [label: string]: string } = {}
  const selectedWithOverrides: Revision[] = []

  for (const selectedRevision of selectedRevisions) {
    collectRevisionDetail(
      orderMapping,
      selectedWithOverrides,
      selectedRevision,
      fetchedRevs,
      unfinishedRunningExperiments,
      getCheckpoints,
      firstThreeColumns
    )
  }

  return {
    overrideComparison: reorderObjectList(
      comparisonOrder.map(revision => orderMapping[revision]),
      selectedWithOverrides,
      'revision'
    ),
    overrideRevisions: selectedWithOverrides
  }
}
