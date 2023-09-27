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
  CustomPlotValues,
  ComparisonRevisionData,
  ComparisonPlotImg
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
import { hasKey } from '../../util/object'
import { MULTI_IMAGE_PATH_REG } from '../../cli/dvc/constants'
import {
  getFileNameWithoutExt,
  getParent,
  getPathArray
} from '../../fileSystem/util'
import { Color } from '../../experiments/model/status/colors'

export const getCustomPlotId = (metric: string, param: string) =>
  `custom-${metric}-${param}`

const getValueFromColumn = (path: string, experiment: Experiment) =>
  get(experiment, splitColumnPath(path)) as number | string | undefined

const getValues = (
  experiments: Experiment[],
  metricPath: string,
  paramPath: string,
  renderLastIds: Set<string> = new Set<string>()
): CustomPlotValues => {
  const values: CustomPlotValues = []

  for (const experiment of experiments) {
    const metricValue = getValueFromColumn(metricPath, experiment)
    const paramValue = getValueFromColumn(paramPath, experiment)

    if (metricValue === undefined || paramValue === undefined) {
      continue
    }

    const value = {
      id: experiment.id,
      metric: metricValue,
      param: paramValue
    }

    renderLastIds.has(experiment.id)
      ? values.push(value)
      : values.unshift(value)
  }

  return values
}

const filterColorScale = (
  completeColorScale: ColorScale,
  values: CustomPlotValues
) => {
  const valueIds = new Set(values.map(({ id }) => id))
  const { domain: completeDomain, range: completeRange } = completeColorScale
  const filteredColorScale: ColorScale = {
    domain: [],
    range: []
  }

  for (const [ind, id] of completeDomain.entries()) {
    if (!valueIds.has(id)) {
      continue
    }
    filteredColorScale.domain.push(id)
    filteredColorScale.range.push(completeRange[ind])
  }
  return filteredColorScale
}

const getCustomPlotData = (
  orderValue: CustomPlotsOrderValue,
  experiments: Experiment[],
  height: number,
  nbItemsPerRow: number,
  completeColorScale: ColorScale,
  renderLastIds: Set<string>
): CustomPlotData => {
  const { metric, param } = orderValue
  const metricPath = getFullValuePath(ColumnType.METRICS, metric)
  const paramPath = getFullValuePath(ColumnType.PARAMS, param)

  const values = getValues(experiments, metricPath, paramPath, renderLastIds)
  const filteredColorScale = filterColorScale(completeColorScale, values)

  const [{ param: paramVal, metric: metricVal }] = values
  const yTitle = truncateVerticalTitle(metric, nbItemsPerRow, height) as string

  const spec = createSpec(
    yTitle,
    metric,
    param,
    typeof metricVal,
    typeof paramVal,
    filteredColorScale
  )

  return {
    id: getCustomPlotId(metric, param),
    metric,
    param,
    spec,
    values
  } as CustomPlotData
}

const fillColorScale = (
  colorScale: ColorScale | undefined,
  experiments: Experiment[]
) => {
  const completeColorScale = {
    domain: [...(colorScale?.domain || [])],
    range: [...(colorScale?.range || [])]
  }

  for (const experiment of experiments) {
    const { id } = experiment
    if (completeColorScale.domain.includes(id)) {
      continue
    }
    completeColorScale.domain.push(id)
    completeColorScale.range.push('#4c78a8' as Color)
  }
  return completeColorScale
}

export const collectCustomPlots = ({
  colorScale,
  plotsOrderValues,
  experiments,
  height,
  nbItemsPerRow
}: {
  colorScale: ColorScale | undefined
  plotsOrderValues: CustomPlotsOrderValue[]
  experiments: Experiment[]
  height: number
  nbItemsPerRow: number
}): CustomPlotData[] => {
  const plots = []

  const completeColorScale = fillColorScale(colorScale, experiments)

  for (const value of plotsOrderValues) {
    plots.push(
      getCustomPlotData(
        value,
        experiments,
        height,
        nbItemsPerRow,
        completeColorScale,
        new Set(colorScale?.domain)
      )
    )
  }

  return plots
}

export const collectCustomPlotRawData = (
  orderValue: CustomPlotsOrderValue,
  experiments: Experiment[]
): Array<Record<string, unknown>> => {
  const { metric, param } = orderValue
  const metricPath = getFullValuePath(ColumnType.METRICS, metric)
  const paramPath = getFullValuePath(ColumnType.PARAMS, param)

  return getValues(experiments, metricPath, paramPath)
}

type RevisionPathData = { [path: string]: Record<string, unknown>[] }

export type RevisionData = {
  [label: string]: RevisionPathData
}

export type ComparisonData = {
  [label: string]: {
    [path: string]: ImagePlot[]
  }
}

const getMultiImagePath = (path: string) =>
  getParent(getPathArray(path), 0) as string

const getMultiImageInd = (path: string) => {
  const fileName = getFileNameWithoutExt(path)
  return Number(fileName)
}

const collectImageData = (
  acc: ComparisonData,
  path: string,
  plot: ImagePlot
) => {
  const isMultiImgPlot = MULTI_IMAGE_PATH_REG.test(path)
  const pathLabel = isMultiImgPlot ? getMultiImagePath(path) : path
  const id = plot.revisions?.[0]

  if (!id) {
    return
  }

  if (!acc[id]) {
    acc[id] = {}
  }

  if (!acc[id][pathLabel]) {
    acc[id][pathLabel] = []
  }

  const imgPlot: ImagePlot = { ...plot }

  if (isMultiImgPlot) {
    imgPlot.ind = getMultiImageInd(path)
  }

  acc[id][pathLabel].push(imgPlot)
}

const collectDatapoints = (
  acc: RevisionData,
  path: string,
  rev: string,
  values: Record<string, unknown>[] = []
) => {
  for (const value of values) {
    const dvc_data_version_info = getDvcDataVersionInfo(value)
    const data: { rev: string; dvc_data_version_info?: unknown } = {
      ...value,
      ...dvc_data_version_info,
      rev
    }

    if (hasKey(data, 'dvc_data_version_info')) {
      delete data.dvc_data_version_info
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

const sortComparisonImgPaths = (acc: DataAccumulator) => {
  for (const [label, paths] of Object.entries(acc.comparisonData)) {
    for (const path of Object.keys(paths)) {
      acc.comparisonData[label][path].sort(
        (img1, img2) => (img1.ind || 0) - (img2.ind || 0)
      )
    }
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

  sortComparisonImgPaths(acc)

  return acc
}

type ComparisonPlotsAcc = { path: string; revisions: ComparisonRevisionData }[]

type GetComparisonPlotImg = (
  img: ImagePlot,
  id: string,
  path: string
) => ComparisonPlotImg

const collectSelectedPathComparisonPlots = ({
  acc,
  comparisonData,
  path,
  selectedRevisionIds,
  getComparisonPlotImg
}: {
  acc: ComparisonPlotsAcc
  comparisonData: ComparisonData
  path: string
  selectedRevisionIds: string[]
  getComparisonPlotImg: GetComparisonPlotImg
}) => {
  const pathRevisions = {
    path,
    revisions: {} as ComparisonRevisionData
  }

  for (const id of selectedRevisionIds) {
    const imgs = comparisonData[id]?.[path]
    pathRevisions.revisions[id] = {
      id,
      imgs: imgs
        ? imgs.map(img => getComparisonPlotImg(img, id, path))
        : [{ errors: undefined, loading: false, url: undefined }]
    }
  }
  acc.push(pathRevisions)
}

export const collectSelectedComparisonPlots = ({
  comparisonData,
  paths,
  selectedRevisionIds,
  getComparisonPlotImg
}: {
  comparisonData: ComparisonData
  paths: string[]
  selectedRevisionIds: string[]
  getComparisonPlotImg: GetComparisonPlotImg
}) => {
  const acc: ComparisonPlotsAcc = []

  for (const path of paths) {
    collectSelectedPathComparisonPlots({
      acc,
      comparisonData,
      getComparisonPlotImg,
      path,
      selectedRevisionIds
    })
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
  const availableRevisions = selectedRevisions.filter(
    rev => revisionData[rev]?.[path]
  )
  const transformNeeded =
    isMultiSource && (isMultiView || isConcatenatedField(field))

  if (!transformNeeded) {
    return {
      datapoints: selectedRevisions
        .flatMap(revision => revisionData[revision]?.[path])
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

export const collectSelectedTemplatePlotRawData = ({
  selectedRevisions,
  path,
  template,
  revisionData,
  multiSourceEncodingUpdate
}: {
  selectedRevisions: string[]
  path: string
  template: string
  revisionData: RevisionData
  multiSourceEncodingUpdate: { strokeDash: StrokeDashEncoding }
}) => {
  const isMultiView = isMultiViewPlot(
    JSON.parse(template) as TopLevelSpec | VisualizationSpec
  )
  const { datapoints } = transformRevisionData(
    path,
    selectedRevisions,
    revisionData,
    isMultiView,
    multiSourceEncodingUpdate
  )

  return datapoints as unknown as Array<Record<string, unknown>>
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
