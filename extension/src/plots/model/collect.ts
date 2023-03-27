import get from 'lodash.get'
import { TopLevelSpec } from 'vega-lite'
import { VisualizationSpec } from 'react-vega'
import {
  getFullValuePath,
  CHECKPOINTS_PARAM,
  CustomPlotsOrderValue,
  isCheckpointValue
} from './custom'
import { getRevisionFirstThreeColumns } from './util'
import {
  ColorScale,
  CheckpointPlotValues,
  isImagePlot,
  ImagePlot,
  TemplatePlot,
  Plot,
  TemplatePlotEntry,
  TemplatePlotSection,
  PlotsType,
  Revision,
  CustomPlotData,
  MetricVsParamPlotValues
} from '../webview/contract'
import { EXPERIMENT_WORKSPACE_ID, PlotsOutput } from '../../cli/dvc/contract'
import { splitColumnPath } from '../../experiments/columns/paths'
import {
  ColumnType,
  Experiment,
  isRunning
} from '../../experiments/webview/contract'
import { TemplateOrder } from '../paths/collect'
import {
  extendVegaSpec,
  isMultiViewPlot,
  truncateVerticalTitle
} from '../vega/util'
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
import {
  ExperimentWithCheckpoints,
  ExperimentWithDefinedCheckpoints,
  SelectedExperimentWithColor
} from '../../experiments/model'
import { Color } from '../../experiments/model/status/colors'

export const getCustomPlotId = (metric: string, param = CHECKPOINTS_PARAM) =>
  `custom-${metric}-${param}`

const getValueFromColumn = (
  path: string,
  experiment: ExperimentWithCheckpoints
) => get(experiment, splitColumnPath(path)) as number | undefined

const isExperimentWithDefinedCheckpoints = (
  experiment: ExperimentWithCheckpoints
): experiment is ExperimentWithDefinedCheckpoints => !!experiment.checkpoints

const collectCheckpointValuesFromExperiment = (
  values: CheckpointPlotValues,
  exp: ExperimentWithDefinedCheckpoints,
  metricPath: string
) => {
  const group = exp.name || exp.label
  const maxEpoch = exp.checkpoints.length + 1

  const metricValue = getValueFromColumn(metricPath, exp)
  if (metricValue !== undefined) {
    values.push({ group, iteration: maxEpoch, y: metricValue })
  }

  for (const [ind, checkpoint] of exp.checkpoints.entries()) {
    const metricValue = getValueFromColumn(metricPath, checkpoint)
    if (metricValue !== undefined) {
      values.push({ group, iteration: maxEpoch - ind - 1, y: metricValue })
    }
  }
}

const getCheckpointValues = (
  experiments: ExperimentWithCheckpoints[],
  metricPath: string
): CheckpointPlotValues => {
  const values: CheckpointPlotValues = []
  for (const experiment of experiments) {
    if (isExperimentWithDefinedCheckpoints(experiment)) {
      collectCheckpointValuesFromExperiment(values, experiment, metricPath)
    }
  }
  return values
}

const getMetricVsParamValues = (
  experiments: ExperimentWithCheckpoints[],
  metricPath: string,
  paramPath: string
): MetricVsParamPlotValues => {
  const values: MetricVsParamPlotValues = []

  for (const experiment of experiments) {
    const metricValue = getValueFromColumn(metricPath, experiment)
    const paramValue = getValueFromColumn(paramPath, experiment)

    if (metricValue !== undefined && paramValue !== undefined) {
      values.push({
        expName: experiment.name || experiment.label,
        metric: metricValue,
        param: paramValue
      })
    }
  }

  return values
}

const getCustomPlotData = (
  orderValue: CustomPlotsOrderValue,
  experiments: ExperimentWithCheckpoints[],
  selectedRevisions: string[] | undefined = [],
  height: number,
  nbItemsPerRow: number
): CustomPlotData => {
  const { metric, param, type } = orderValue
  const metricPath = getFullValuePath(ColumnType.METRICS, metric)

  const paramPath = getFullValuePath(ColumnType.PARAMS, param)

  const selectedExperiments = experiments.filter(({ name, label }) =>
    selectedRevisions.includes(name || label)
  )

  const values = isCheckpointValue(type)
    ? getCheckpointValues(selectedExperiments, metricPath)
    : getMetricVsParamValues(experiments, metricPath, paramPath)

  return {
    id: getCustomPlotId(metric, param),
    metric,
    param,
    type,
    values,
    yTitle: truncateVerticalTitle(metric, nbItemsPerRow, height) as string
  } as CustomPlotData
}

export const collectCustomPlots = ({
  plotsOrderValues,
  experiments,
  hasCheckpoints,
  selectedRevisions,
  height,
  nbItemsPerRow
}: {
  plotsOrderValues: CustomPlotsOrderValue[]
  experiments: ExperimentWithCheckpoints[]
  hasCheckpoints: boolean
  selectedRevisions: string[] | undefined
  height: number
  nbItemsPerRow: number
}): CustomPlotData[] => {
  const plots = []
  const shouldSkipCheckpointPlots = !hasCheckpoints

  for (const value of plotsOrderValues) {
    if (shouldSkipCheckpointPlots && isCheckpointValue(value.type)) {
      continue
    }

    plots.push(
      getCustomPlotData(
        value,
        experiments,
        selectedRevisions,
        height,
        nbItemsPerRow
      )
    )
  }

  return plots
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
  height: number,
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
    height,
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
  height: number,
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
      height,
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
  height: number,
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
      height,
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
