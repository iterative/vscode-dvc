import get from 'lodash.get'
import type { TopLevelSpec } from 'vega-lite'
import isEmpty from 'lodash.isempty'
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
  ComparisonPlotClasses,
  ComparisonClassesSelected,
  ComparisonPlotClass,
  ComparisonPlotRow
} from '../webview/contract'
import {
  AnchorDefinitions,
  PLOT_ANCHORS,
  isImagePlotOutput,
  PlotOutput,
  PlotsOutput,
  PlotsType,
  TemplatePlotOutput,
  ImagePlotOutput
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
import { Color, getBoundingBoxColor } from '../../common/colors'

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

  if (plot.annotations) {
    imgPlot.annotations = plot.annotations
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

type GetComparisonPlotImg = (
  img: ImagePlot,
  id: string,
  path: string
) => ComparisonPlotImg

const collectSelectedPlotImgClassLabels = (
  boundingBoxClassLabels: Set<string>,
  imgs: ImagePlot[] = []
) => {
  for (const img of imgs) {
    if (!img.annotations) {
      continue
    }

    for (const label of Object.keys(img.annotations)) {
      boundingBoxClassLabels.add(label)
    }
  }
}

const getSelectedPathComparisonPlotClassDetails = (
  boundingBoxClassLabels: Set<string>,
  comparisonClassesSelected: ComparisonClassesSelected,
  path: string
) => {
  const classDetails: ComparisonClassDetails = {}

  let classLabelInd = 0
  for (const label of boundingBoxClassLabels) {
    const selectedState = comparisonClassesSelected[path]?.[label]
    classDetails[label] = {
      color: getBoundingBoxColor(classLabelInd),
      selected: selectedState === undefined ? true : selectedState
    }
    classLabelInd++
  }

  return classDetails
}

const collectSelectedPathComparisonPlots = ({
  acc,
  comparisonData,
  comparisonClassesSelected,
  path,
  selectedRevisionIds,
  getComparisonPlotImg
}: {
  acc: ComparisonPlotRow[]
  comparisonData: ComparisonData
  comparisonClassesSelected: ComparisonClassesSelected
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
        ? imgs.map(img => getComparisonPlotImg(img, id, path))
        : [{ errors: undefined, loading: false, url: undefined }]
    }
    collectSelectedPlotImgClassLabels(boundingBoxClassLabels, imgs)
  }

  pathRevisions.classDetails = getSelectedPathComparisonPlotClassDetails(
    boundingBoxClassLabels,
    comparisonClassesSelected,
    path
  )

  acc.push(pathRevisions)
}

export const collectSelectedComparisonPlots = ({
  comparisonData,
  comparisonClassesSelected,
  paths,
  selectedRevisionIds,
  getComparisonPlotImg
}: {
  comparisonData: ComparisonData
  comparisonClassesSelected: ComparisonClassesSelected
  paths: string[]
  selectedRevisionIds: string[]
  getComparisonPlotImg: GetComparisonPlotImg
}): ComparisonPlotRow[] => {
  const acc: ComparisonPlotRow[] = []

  for (const path of paths) {
    collectSelectedPathComparisonPlots({
      acc,
      comparisonClassesSelected,
      comparisonData,
      getComparisonPlotImg,
      path,
      selectedRevisionIds
    })
  }

  return acc
}

const getSelectedImgComparisonPlotClasses = ({
  selectedClassLabels,
  img
}: {
  selectedClassLabels: string[]
  img: ImagePlot
  path: string
}) => {
  const imgAnnotations = img.annotations
  if (!imgAnnotations) {
    return []
  }
  const imgClasses: ComparisonPlotClass[] = []

  for (const label of selectedClassLabels) {
    const boxes = imgAnnotations[label]

    if (boxes) {
      imgClasses.push({
        boxes,
        label
      })
    }
  }

  return imgClasses
}

const collectedSelectedPathComparisonPlotClasses = ({
  acc,
  id,
  comparisonData,
  path,
  selectedClassLabels
}: {
  acc: ComparisonPlotClasses
  selectedClassLabels: string[]
  comparisonData: ComparisonData
  path: string
  id: string
}) => {
  for (const img of comparisonData[id][path]) {
    const imgClasses = getSelectedImgComparisonPlotClasses({
      img,
      path,
      selectedClassLabels
    })

    if (imgClasses.length === 0) {
      return
    }

    if (!acc[id]) {
      acc[id] = {}
    }

    acc[id][path] = imgClasses
  }
}

export const collectSelectedComparisonPlotClasses = ({
  comparisonData,
  plots,
  selectedRevisionIds
}: {
  comparisonData: ComparisonData
  plots: ComparisonPlotRow[]
  selectedRevisionIds: string[]
}): ComparisonPlotClasses => {
  const acc: ComparisonPlotClasses = {}

  for (const { path, classDetails } of plots) {
    const selectedClassLabels = Object.keys(classDetails).filter(
      (label: string) => classDetails[label].selected
    )
    if (isEmpty(classDetails) || isEmpty(selectedClassLabels)) {
      continue
    }

    for (const id of selectedRevisionIds) {
      collectedSelectedPathComparisonPlotClasses({
        acc,
        comparisonData,
        id,
        path,
        selectedClassLabels
      })
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
