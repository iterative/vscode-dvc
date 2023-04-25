import get from 'lodash.get'
import { TopLevelSpec } from 'vega-lite'
import { VisualizationSpec } from 'react-vega'
import { createSpec, CustomPlotsOrderValue, getFullValuePath } from './custom'
import {
  ColorScale,
  isImagePlot,
  ImagePlot,
  TemplatePlot,
  Plot,
  TemplatePlotEntry,
  TemplatePlotSection,
  PlotsType,
  CustomPlotData,
  CustomPlotValues
} from '../webview/contract'
import { PlotsOutput } from '../../cli/dvc/contract'
import { splitColumnPath } from '../../experiments/columns/paths'
import { ColumnType, Experiment } from '../../experiments/webview/contract'
import { TemplateOrder } from '../paths/collect'
import {
  extendVegaSpec,
  isMultiViewPlot,
  truncateVerticalTitle
} from '../vega/util'
import { definedAndNonEmpty } from '../../util/array'
import {
  getDvcDataVersionInfo,
  isConcatenatedField,
  mergeFields,
  MultiSourceEncoding,
  unmergeConcatenatedFields
} from '../multiSource/collect'
import { StrokeDashEncoding } from '../multiSource/constants'
import { exists } from '../../fileSystem'

export const getCustomPlotId = (metric: string, param: string) =>
  `custom-${metric}-${param}`

const getValueFromColumn = (path: string, experiment: Experiment) =>
  get(experiment, splitColumnPath(path)) as number | undefined

const getValues = (
  experiments: Experiment[],
  metricPath: string,
  paramPath: string
): CustomPlotValues => {
  const values: CustomPlotValues = []

  for (const experiment of experiments) {
    const metricValue = getValueFromColumn(metricPath, experiment)
    const paramValue = getValueFromColumn(paramPath, experiment)

    if (metricValue !== undefined && paramValue !== undefined) {
      values.push({
        id: experiment.id,
        metric: metricValue,
        param: paramValue
      })
    }
  }

  return values
}

const getCustomPlotData = (
  orderValue: CustomPlotsOrderValue,
  experiments: Experiment[],
  height: number,
  nbItemsPerRow: number
): CustomPlotData => {
  const { metric, param } = orderValue
  const metricPath = getFullValuePath(ColumnType.METRICS, metric)
  const paramPath = getFullValuePath(ColumnType.PARAMS, param)

  const values = getValues(experiments, metricPath, paramPath)

  const yTitle = truncateVerticalTitle(metric, nbItemsPerRow, height) as string

  const spec = createSpec(yTitle, metric, param)

  return {
    id: getCustomPlotId(metric, param),
    metric,
    param,
    spec,
    values
  } as CustomPlotData
}

export const collectCustomPlots = ({
  plotsOrderValues,
  experiments,
  height,
  nbItemsPerRow
}: {
  plotsOrderValues: CustomPlotsOrderValue[]
  experiments: Experiment[]
  height: number
  nbItemsPerRow: number
}): CustomPlotData[] => {
  const plots = []

  for (const value of plotsOrderValues) {
    plots.push(getCustomPlotData(value, experiments, height, nbItemsPerRow))
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

const collectImageData = (
  acc: ComparisonData,
  path: string,
  plot: ImagePlot
) => {
  const id = plot.revisions?.[0]
  if (!id) {
    return
  }

  if (!acc[id]) {
    acc[id] = {}
  }

  acc[id][path] = plot
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
  plot: TemplatePlot
) => {
  for (const id of plot.revisions || []) {
    if (!acc[id]) {
      acc[id] = {}
    }
    acc[id][path] = []

    collectDatapoints(acc, path, id, plot.datapoints?.[id])
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

export const collectData = (output: PlotsOutput): DataAccumulator => {
  const { data } = output
  const acc = {
    comparisonData: {},
    revisionData: {}
  } as DataAccumulator

  for (const [path, plots] of Object.entries(data)) {
    collectPathData(acc, path, plots)
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

export const collectTemplates = (output: PlotsOutput): TemplateAccumulator => {
  const { data } = output
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
  datapoints: unknown[],
  size: [number, number]
): TopLevelSpec => {
  return JSON.parse(
    template
      .replace('"<DVC_METRIC_DATA>"', JSON.stringify(datapoints))
      .replace('"width":300', `"width":${size[0]}`)
      .replace('"height":300', `"height":${size[1]}`)
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
  multiSourceEncoding: MultiSourceEncoding,
  screenDimensions: [number, number]
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

  const plotWidth = screenDimensions[0] / nbItemsPerRow
  const ratios = [2, 9 / 5, 4 / 3, 1, 3 / 4, 3 / 5]
  const plotHeight = plotWidth / ratios[height]

  const content = extendVegaSpec(
    fillTemplate(template, datapoints, [plotWidth, plotHeight]),
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
  multiSourceEncoding: MultiSourceEncoding,
  screenDimensions: [number, number]
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
      multiSourceEncoding,
      screenDimensions
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
  multiSourceEncoding: MultiSourceEncoding,
  screenDimensions: [number, number]
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
      multiSourceEncoding,
      screenDimensions
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

export const collectOrderedRevisions = (
  revisions: {
    id: string
    Created?: string | null
  }[]
): { id: string; Created?: string | null }[] => {
  return [...revisions].sort((a, b) => {
    if (a.id === 'workspace') {
      return -1
    }
    if (b.id === 'workspace') {
      return 1
    }
    return (b.Created || '').localeCompare(a.Created || '')
  })
}

export const collectImageUrl = (
  image: ImagePlot | undefined,
  fetched: boolean
): string | undefined => {
  const url = image?.url
  if (!url) {
    return
  }

  if (!fetched && !exists(url)) {
    return undefined
  }

  return url
}

export const collectIdShas = (experiments: Experiment[]) => {
  const idShas: Record<string, string> = {}
  for (const { id, sha } of experiments) {
    if (sha) {
      idShas[id] = sha
    }
  }
  return idShas
}
