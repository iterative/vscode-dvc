import get from 'lodash.get'
import type { TopLevelSpec } from 'vega-lite'
import {
  getContent,
  CustomPlotsOrderValue,
  getFullValuePath,
  getDataType
} from './custom'
import {
  ColorScale,
  ImagePlot,
  TemplatePlotEntry,
  TemplatePlotSection,
  CustomPlotData,
  CustomPlotValues,
  ComparisonRevisionData,
  ComparisonPlotImg,
  ComparisonClassDetails,
  ComparisonPlotClasses
} from '../webview/contract'
import {
  AnchorDefinitions,
  PLOT_ANCHORS,
  isImagePlotOutput,
  PlotOutput,
  PlotsOutput,
  PlotsType,
  TemplatePlotOutput,
  ImagePlotOutput,
  BoundingBox
} from '../../cli/dvc/contract'
import { splitColumnPath } from '../../experiments/columns/paths'
import { ColumnType, Experiment } from '../../experiments/webview/contract'
import { TemplateOrder } from '../paths/collect'
import { definedAndNonEmpty } from '../../util/array'
import { exists } from '../../fileSystem'
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

const removeSelectedExperiment = (
  orderedColorScale: ColorScale,
  hasValues: boolean,
  idx: number
) => {
  const isSelectedExperiment = idx !== -1
  if (!isSelectedExperiment || hasValues) {
    return
  }

  orderedColorScale.domain.splice(idx, 1)
  orderedColorScale.range.splice(idx, 1)
}

const fillColorScale = (
  experiments: Experiment[],
  colorScale: ColorScale | undefined,
  valueIds: Set<string>
) => {
  const orderedColorScale = {
    domain: [...(colorScale?.domain || [])],
    range: [...(colorScale?.range || [])]
  }

  for (const experiment of experiments) {
    const { id } = experiment
    const idx = orderedColorScale.domain.indexOf(id)
    const isSelectedExperiment = idx !== -1
    const hasValues = valueIds.has(id)

    if (!hasValues || isSelectedExperiment) {
      removeSelectedExperiment(orderedColorScale, hasValues, idx)
      continue
    }

    orderedColorScale.domain.push(id)
    orderedColorScale.range.push('#4c78a8' as Color)
  }

  return orderedColorScale
}

const getCustomPlotData = (
  orderValue: CustomPlotsOrderValue,
  experiments: Experiment[],
  colorScale: ColorScale | undefined
): CustomPlotData => {
  const { metric, param } = orderValue
  const metricPath = getFullValuePath(ColumnType.METRICS, metric)
  const paramPath = getFullValuePath(ColumnType.PARAMS, param)

  const renderLastIds = new Set(colorScale?.domain)
  const values = getValues(experiments, metricPath, paramPath, renderLastIds)
  const valueIds = new Set(values.map(({ id }) => id))
  const completeColorScale = fillColorScale(experiments, colorScale, valueIds)

  const [{ param: paramVal, metric: metricVal }] = values

  return {
    anchorDefinitions: {
      [PLOT_ANCHORS.COLOR]: {
        field: 'id',
        scale: completeColorScale
      },
      [PLOT_ANCHORS.DATA]: values,
      [PLOT_ANCHORS.METRIC_TYPE]: getDataType(typeof metricVal),
      [PLOT_ANCHORS.PARAM_TYPE]: getDataType(typeof paramVal),
      [PLOT_ANCHORS.X_LABEL]: param,
      [PLOT_ANCHORS.Y_LABEL]: metric,
      [PLOT_ANCHORS.ZOOM_AND_PAN]: {
        bind: 'scales',
        name: 'grid',
        select: 'interval'
      }
    },
    content: getContent(),
    id: getCustomPlotId(metric, param),
    metric,
    param
  }
}

export const collectCustomPlots = ({
  colorScale,
  plotsOrderValues,
  experiments
}: {
  colorScale: ColorScale | undefined
  plotsOrderValues: CustomPlotsOrderValue[]
  experiments: Experiment[]
}): CustomPlotData[] => {
  const plots = []

  for (const value of plotsOrderValues) {
    plots.push(getCustomPlotData(value, experiments, colorScale))
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

const collectImageBoundingBoxes = (
  boundingBoxes: { label: string; box: BoundingBox }[]
): { [label: string]: BoundingBox[] } => {
  const acc: { [label: string]: BoundingBox[] } = {}

  for (const { label, box } of boundingBoxes) {
    if (!acc[label]) {
      acc[label] = []
    }

    acc[label].push(box)
  }

  return acc
}

const collectImageData = (
  acc: ComparisonData,
  path: string,
  plot: ImagePlotOutput
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

  const imgPlot: ImagePlot = {
    revisions: plot.revisions,
    type: plot.type,
    url: plot.url
  }

  if (isMultiImgPlot) {
    imgPlot.ind = getMultiImageInd(path)
  }

  if (plot.boundingBoxes) {
    imgPlot.boundingBoxes = collectImageBoundingBoxes(plot.boundingBoxes)
  }

  acc[id][pathLabel].push(imgPlot)
}

const initializeAcc = (
  acc: RevisionData,
  path: string,
  revisions: string[]
) => {
  for (const id of revisions || []) {
    if (!acc[id]) {
      acc[id] = {}
    }
    acc[id][path] = []
  }
}

const collectPlotData = (
  acc: RevisionData,
  path: string,
  plot: TemplatePlotOutput
) => {
  initializeAcc(acc, path, plot.revisions || [])

  for (const data of (plot.anchor_definitions[PLOT_ANCHORS.DATA] as {
    rev?: string
  }[]) || []) {
    const rev = data.rev
    if (!rev) {
      continue
    }
    acc[rev][path].push(data)
  }
}

type DataAccumulator = {
  revisionData: RevisionData
  comparisonData: ComparisonData
}

const collectPathData = (
  acc: DataAccumulator,
  path: string,
  plots: PlotOutput[]
) => {
  for (const plot of plots) {
    if (isImagePlotOutput(plot)) {
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

type ComparisonPlotsAcc = {
  classDetails: ComparisonClassDetails
  path: string
  revisions: ComparisonRevisionData
}[]

type GetComparisonPlotImg = (
  img: ImagePlot,
  id: string,
  path: string
) => ComparisonPlotImg

export const boundingBoxColors = [
  '#ff3838',
  '#ff9d97',
  '#ff701f',
  '#ffb21d',
  '#cfd231',
  '#48f90a',
  '#92cc17',
  '#3ddb86',
  '#1a9334',
  '#00d4bb',
  '#2c99a8',
  '#00c2ff',
  '#344593',
  '#6473ff',
  '#0018ec',
  '#8438ff',
  '#520085',
  '#cb38ff',
  '#ff95c8',
  '#ff37c7'
]

const collectComparisonPlotImgs = (
  boundingBoxClassLabels: Set<string>,
  imgs: ImagePlot[],
  getComparisonPlotImg: GetComparisonPlotImg,
  id: string,
  path: string
) => {
  const plotImgs = []
  for (const img of imgs) {
    plotImgs.push(getComparisonPlotImg(img, id, path))

    if (img.boundingBoxes) {
      for (const label of Object.keys(img.boundingBoxes)) {
        boundingBoxClassLabels.add(label)
      }
    }
  }

  return plotImgs
}

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
  const boundingBoxClassLabels = new Set<string>()
  const pathRevisions = {
    classDetails: {} as ComparisonClassDetails,
    path,
    revisions: {} as ComparisonRevisionData
  }

  for (const id of selectedRevisionIds) {
    const imgs: ImagePlot[] | undefined = comparisonData[id]?.[path]

    pathRevisions.revisions[id] = {
      id,
      imgs: imgs
        ? collectComparisonPlotImgs(
            boundingBoxClassLabels,
            imgs,
            getComparisonPlotImg,
            id,
            path
          )
        : [{ errors: undefined, loading: false, url: undefined }]
    }
  }

  for (const [ind, label] of [...boundingBoxClassLabels].entries()) {
    pathRevisions.classDetails[label] = {
      color: boundingBoxColors[ind % boundingBoxColors.length],
      selected: true // we will need to check the saved state to see if we should set selected
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
}): ComparisonPlotsAcc => {
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

const collectSelectedImgComparisonPlotClasses = (
  acc: ComparisonPlotClasses,
  img: ImagePlot,
  path: string,
  id: string
) => {
  if (!img.boundingBoxes) {
    return
  }

  if (!acc[id]) {
    acc[id] = {}
  }

  if (!acc[id][path]) {
    acc[id][path] = []
  }

  acc[id][path] = Object.entries(img.boundingBoxes).map(([label, boxes]) => ({
    boxes: boxes.map(({ x_min, x_max, y_min, y_max }) => ({
      h: y_max - y_min,
      w: x_max - x_min,
      x: x_min,
      y: y_min
    })),
    label
  }))
}

export const collectSelectedComparisonPlotClasses = ({
  comparisonData,
  paths,
  selectedRevisionIds
}: {
  comparisonData: ComparisonData
  paths: string[]
  selectedRevisionIds: string[]
}) => {
  const acc: ComparisonPlotClasses = {}

  for (const path of paths) {
    for (const id of selectedRevisionIds) {
      for (const img of comparisonData[id][path]) {
        collectSelectedImgComparisonPlotClasses(acc, img, path, id)
      }
    }
  }

  return acc
}

export type TemplateDetailsAccumulator = {
  [path: string]: {
    content: TopLevelSpec
    anchorDefinitions: AnchorDefinitions
  }
}

const collectTemplateDetails = (
  acc: TemplateDetailsAccumulator,
  path: string,
  plot: PlotOutput
) => {
  if (isImagePlotOutput(plot) || acc[path]) {
    return
  }
  const { anchor_definitions, content } = plot
  delete anchor_definitions[PLOT_ANCHORS.COLOR]
  acc[path] = { anchorDefinitions: anchor_definitions, content }
}

export const collectTemplatesDetails = (
  output: PlotsOutput
): TemplateDetailsAccumulator => {
  const { data } = output
  const acc: TemplateDetailsAccumulator = {}

  for (const [path, plots] of Object.entries(data)) {
    for (const plot of plots) {
      collectTemplateDetails(acc, path, plot)
    }
  }

  return acc
}

const collectTemplatePlot = (
  acc: TemplatePlotEntry[],
  selectedRevisions: string[],
  path: string,
  content: TopLevelSpec,
  anchorDefinitions: AnchorDefinitions,
  revisionData: RevisionData,
  colorScale: ColorScale
) => {
  const datapoints = selectedRevisions
    .flatMap(revision => revisionData[revision]?.[path])
    .filter(Boolean)

  if (datapoints.length === 0) {
    return
  }

  acc.push({
    anchorDefinitions: {
      ...anchorDefinitions,
      [PLOT_ANCHORS.COLOR]: { field: 'rev', scale: colorScale },
      [PLOT_ANCHORS.DATA]: datapoints
    },
    content,
    id: path,
    revisions: selectedRevisions,
    type: PlotsType.VEGA
  })
}

const collectTemplateGroup = (
  paths: string[],
  selectedRevisions: string[],
  templates: TemplateDetailsAccumulator,
  revisionData: RevisionData,
  colorScale: ColorScale
): TemplatePlotEntry[] => {
  const acc: TemplatePlotEntry[] = []
  for (const path of paths) {
    const templateDetails = templates[path]

    if (!templateDetails) {
      continue
    }

    const { content, anchorDefinitions } = templateDetails

    collectTemplatePlot(
      acc,
      selectedRevisions,
      path,
      content,
      anchorDefinitions,
      revisionData,
      colorScale
    )
  }
  return acc
}

export const collectSelectedTemplatePlots = (
  order: TemplateOrder,
  selectedRevisions: string[],
  templates: TemplateDetailsAccumulator,
  revisionData: RevisionData,
  colorScale: ColorScale | undefined
): TemplatePlotSection[] | undefined => {
  const acc: TemplatePlotSection[] = []
  if (!colorScale) {
    return acc
  }
  for (const templateGroup of order) {
    const { paths, group } = templateGroup
    const entries = collectTemplateGroup(
      paths,
      selectedRevisions,
      templates,
      revisionData,
      colorScale
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
  revisionData
}: {
  selectedRevisions: string[]
  path: string
  revisionData: RevisionData
}) => {
  return selectedRevisions
    .flatMap(revision => revisionData[revision]?.[path])
    .filter(Boolean)
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
