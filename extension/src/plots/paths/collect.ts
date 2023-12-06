import { sep } from 'path'
import { TemplatePlotGroup } from '../webview/contract'
import {
  EXPERIMENT_WORKSPACE_ID,
  ImagePlotOutput,
  isImagePlotOutput,
  PlotError,
  PlotOutput,
  PlotsData,
  PlotsOutput,
  ShapeScale,
  ShapeValue,
  StrokeDashScale,
  StrokeDashValue,
  TemplatePlotOutput
} from '../../cli/dvc/contract'
import { getParent, getPath, getPathArray } from '../../fileSystem/util'
import { splitMatchedOrdered, definedAndNonEmpty } from '../../util/array'
import { isMultiViewPlot } from '../vega/util'
import { createTypedAccumulator } from '../../util/object'
import { truncate } from '../../util/string'
import { FIELD_SEPARATOR, MULTI_IMAGE_PATH_REG } from '../../cli/dvc/constants'
import { MultiSourceEncoding } from '../multiSource/collect'

export enum PathType {
  COMPARISON = 'comparison',
  TEMPLATE_MULTI = 'template-multi',
  TEMPLATE_SINGLE = 'template-single'
}

export type PlotPath = {
  hasChildren: boolean
  label: string
  parentPath: string | undefined
  path: string
  revisions: Set<string>
  type?: Set<PathType>
}

const collectType = (plots: PlotOutput[]) => {
  const type = new Set<PathType>()

  for (const plot of plots) {
    if (isImagePlotOutput(plot)) {
      type.add(PathType.COMPARISON)
      continue
    }

    isMultiViewPlot(plot.content, plot.anchor_definitions)
      ? type.add(PathType.TEMPLATE_MULTI)
      : type.add(PathType.TEMPLATE_SINGLE)
  }
  return type
}

const getType = (data: PlotsData, path: string): Set<PathType> | undefined => {
  const plots = data[path]
  if (!definedAndNonEmpty(plots)) {
    return
  }

  return collectType(plots)
}

const filterRevisionIfFetched = (
  existingPaths: PlotPath[],
  fetchedRevs: string[]
) => {
  return existingPaths.map(existing => {
    const revisions = existing.revisions
    for (const id of fetchedRevs) {
      revisions.delete(id)
    }
    return { ...existing, revisions }
  })
}

const collectImageRevision = (
  acc: Set<string>,
  plot: ImagePlotOutput
): void => {
  const id = plot.revisions?.[0]
  if (id) {
    acc.add(id)
  }
}

const collectTemplateRevisions = (
  acc: Set<string>,
  plot: TemplatePlotOutput
): void => {
  for (const rev of plot.revisions || []) {
    acc.add(rev)
  }
}

const collectPathRevisions = (data: PlotsData, path: string): Set<string> => {
  const revisions = new Set<string>()

  for (const plot of data[path] || []) {
    if (isImagePlotOutput(plot)) {
      collectImageRevision(revisions, plot)
      continue
    }

    collectTemplateRevisions(revisions, plot)
  }

  return revisions
}

const collectPlotPathType = (
  plotPath: PlotPath,
  data: PlotsData,
  hasChildren: boolean,
  path: string,
  isMultiImgPlot: boolean
) => {
  if (hasChildren) {
    return
  }

  const type = isMultiImgPlot
    ? new Set<PathType>([PathType.COMPARISON])
    : getType(data, path)

  if (type) {
    plotPath.type = type
  }
}

const updateExistingPlotPath = ({
  acc,
  data,
  hasChildren,
  revisions,
  path,
  pathInd,
  isMultiImgPlot
}: {
  acc: PlotPath[]
  data: PlotsData
  hasChildren: boolean
  revisions: Set<string>
  path: string
  pathInd: number
  isMultiImgPlot: boolean
}) => {
  const plotPath = { ...acc[pathInd] }

  plotPath.revisions = new Set([...plotPath.revisions, ...revisions])

  collectPlotPathType(plotPath, data, hasChildren, path, isMultiImgPlot)
  acc[pathInd] = plotPath

  return acc
}

const separateDvcYamlPath = (path: string): string[] => {
  if (!path.includes(FIELD_SEPARATOR)) {
    return getPathArray(path)
  }

  const [dvcYamlPath, plotPath] = path.split(FIELD_SEPARATOR)
  return [dvcYamlPath, ...getPathArray(plotPath)]
}

const joinDvcYamlPath = (pathArray: string[], idx: number): string => {
  if (!pathArray[0].endsWith('dvc.yaml')) {
    return getPath(pathArray, idx)
  }

  const dvcYamlPath = pathArray[0]
  const plotPath = pathArray.slice(1, idx).join(sep)

  if (!plotPath) {
    return dvcYamlPath
  }

  return [dvcYamlPath, plotPath].join(FIELD_SEPARATOR)
}

const joinDvcYamlParentPath = (
  pathArray: string[],
  idx: number
): string | undefined => {
  if (!pathArray[0].endsWith('dvc.yaml')) {
    return getParent(pathArray, idx)
  }

  const noParent = idx - 1 <= 0
  if (noParent) {
    return undefined
  }

  return joinDvcYamlPath(pathArray, idx - 1)
}

const collectOrderedPath = (
  acc: PlotPath[],
  data: PlotsData,
  revisions: Set<string>,
  pathArray: string[],
  idx: number,
  isMultiImgDir: boolean
): PlotPath[] => {
  const path = joinDvcYamlPath(pathArray, idx)
  const hasChildren = idx !== pathArray.length
  const isPathLeaf = idx === pathArray.length
  const isMultiImgPlot = isMultiImgDir && isPathLeaf

  const existingPathInd = acc.findIndex(existing => existing.path === path)
  if (existingPathInd !== -1) {
    return updateExistingPlotPath({
      acc,
      data,
      hasChildren,
      isMultiImgPlot,
      path,
      pathInd: existingPathInd,
      revisions
    })
  }

  const plotPath: PlotPath = {
    hasChildren,
    label: pathArray[idx - 1],
    parentPath: joinDvcYamlParentPath(pathArray, idx),
    path,
    revisions
  }

  collectPlotPathType(plotPath, data, hasChildren, path, isMultiImgPlot)

  acc.push(plotPath)
  return acc
}

const addRevisionsToPath = (
  acc: PlotPath[],
  data: PlotsData,
  path: string,
  revisions: Set<string>
): PlotPath[] => {
  if (revisions.size === 0) {
    return acc
  }

  const pathArray = separateDvcYamlPath(path)
  const isMultiImg =
    MULTI_IMAGE_PATH_REG.test(path) &&
    !!getType(data, path)?.has(PathType.COMPARISON)

  if (isMultiImg) {
    pathArray.pop()
  }

  for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
    acc = collectOrderedPath(
      acc,
      data,
      revisions,
      pathArray,
      reverseIdx,
      isMultiImg
    )
  }
  return acc
}

const collectDataPaths = (acc: PlotPath[], data: PlotsData) => {
  const paths = Object.keys(data)

  for (const path of paths) {
    const revisions = collectPathRevisions(data, path)
    acc = addRevisionsToPath(acc, data, path, revisions)
  }
  return acc
}

const collectErrorRevisions = (
  path: string,
  errors: PlotError[]
): Set<string> => {
  const acc = new Set<string>()
  for (const error of errors) {
    const { name, rev } = error
    if (name === path) {
      acc.add(rev)
    }
  }
  return acc
}

const collectErrorPaths = (
  acc: PlotPath[],
  data: PlotsData,
  errors: PlotError[]
) => {
  const paths = errors.map(({ name }) => name)
  for (const path of paths) {
    if (!path) {
      continue
    }
    const revisions = collectErrorRevisions(path, errors)
    acc = addRevisionsToPath(acc, data, path, revisions)
  }
  return acc
}

export const collectPaths = (
  existingPaths: PlotPath[],
  output: PlotsOutput,
  fetchedRevs: string[]
): PlotPath[] => {
  let acc: PlotPath[] = filterRevisionIfFetched(existingPaths, fetchedRevs)
  const { data, errors } = output

  acc = collectDataPaths(acc, data)

  if (errors?.length) {
    acc = collectErrorPaths(acc, data, errors)
  }
  return acc
}

export type TemplateOrder = { paths: string[]; group: TemplatePlotGroup }[]

type RemainingPathAccumulator = {
  remainingSingleView: string[]
  remainingMultiView: string[]
}

const collectFromRemaining = (
  remainingPaths: RemainingPathAccumulator,
  paths: string[],
  remainingType: 'remainingSingleView' | 'remainingMultiView'
): string[] => {
  const [acc, remaining] = splitMatchedOrdered(
    remainingPaths[remainingType],
    paths
  )

  remainingPaths[remainingType] = remaining

  return acc
}

const collectGroupPaths = (
  acc: RemainingPathAccumulator,
  group: TemplatePlotGroup,
  existingPaths: string[]
): string[] => {
  if (group === TemplatePlotGroup.MULTI_VIEW) {
    return collectFromRemaining(acc, existingPaths, 'remainingMultiView')
  }
  return collectFromRemaining(acc, existingPaths, 'remainingSingleView')
}

const collectExistingOrder = (
  newTemplateOrder: TemplateOrder,
  singleViewPaths: string[],
  multiViewPaths: string[],
  existingTemplateOrder: TemplateOrder
): RemainingPathAccumulator => {
  const acc = {
    remainingMultiView: [...multiViewPaths],
    remainingSingleView: [...singleViewPaths]
  }
  for (const templateGroup of existingTemplateOrder) {
    const { group, paths: existingPaths } = templateGroup
    if (!definedAndNonEmpty(existingPaths)) {
      continue
    }

    const paths = collectGroupPaths(acc, group, existingPaths)
    if (!definedAndNonEmpty(paths)) {
      continue
    }
    newTemplateOrder.push({ group, paths })
  }
  return acc
}

const collectUnordered = (
  newTemplateOrder: TemplateOrder,
  remaining: string[],
  group: TemplatePlotGroup
) => {
  if (!definedAndNonEmpty(remaining)) {
    return
  }

  if (definedAndNonEmpty(newTemplateOrder)) {
    const [lastTemplateGroup] = newTemplateOrder.slice(-1)
    const { group: lastGroup, paths } = lastTemplateGroup

    if (group === lastGroup) {
      paths.push(...remaining)
      newTemplateOrder[newTemplateOrder.length - 1] = {
        group,
        paths
      }
      return
    }
  }

  newTemplateOrder.push({
    group,
    paths: remaining
  })
}

const mergeAdjacentMatching = (newTemplateOrder: TemplateOrder) => {
  const mergedTemplateOrder: TemplateOrder = []
  for (const [idx, { paths, group }] of newTemplateOrder.entries()) {
    const nextGroup = newTemplateOrder[idx + 1]
    if (nextGroup?.group === group) {
      nextGroup.paths.unshift(...paths)
      continue
    }
    mergedTemplateOrder.push({ group, paths })
  }
  return mergedTemplateOrder
}

export const collectTemplateOrder = (
  singleViewPaths: string[],
  multiViewPaths: string[],
  existingTemplateOrder: TemplateOrder
): TemplateOrder => {
  const newTemplateOrder: TemplateOrder = []

  if (!definedAndNonEmpty([...singleViewPaths, ...multiViewPaths])) {
    return newTemplateOrder
  }

  const { remainingSingleView, remainingMultiView } = collectExistingOrder(
    newTemplateOrder,
    singleViewPaths,
    multiViewPaths,
    existingTemplateOrder
  )

  collectUnordered(
    newTemplateOrder,
    remainingSingleView,
    TemplatePlotGroup.SINGLE_VIEW
  )
  collectUnordered(
    newTemplateOrder,
    remainingMultiView,
    TemplatePlotGroup.MULTI_VIEW
  )

  return mergeAdjacentMatching(newTemplateOrder)
}

export const PlotsScale = {
  IMAGES: 'images',
  TEMPLATES: 'templates'
} as const
type PlotsScale = (typeof PlotsScale)[keyof typeof PlotsScale]
type PlotsScaleAccumulator = Record<PlotsScale, number>

const addToScale = (acc: PlotsScaleAccumulator, type?: Set<PathType>) => {
  if (!type) {
    return
  }
  if (type.has(PathType.TEMPLATE_MULTI) || type.has(PathType.TEMPLATE_SINGLE)) {
    acc.templates = acc.templates + 1
  }
  if (type.has(PathType.COMPARISON)) {
    acc.images = acc.images + 1
  }
}

export const collectScale = (paths: PlotPath[] = []) => {
  const acc = createTypedAccumulator(PlotsScale)

  for (const { type } of paths) {
    addToScale(acc, type)
  }
  return acc
}

export enum EncodingType {
  SHAPE = 'shape',
  STROKE_DASH = 'strokeDash'
}

type EncodingElement =
  | {
      type: EncodingType.STROKE_DASH
      value: StrokeDashValue
      label: string
    }
  | {
      type: EncodingType.SHAPE
      value: ShapeValue
      label: string
    }

export const isEncodingElement = (
  element: unknown
): element is EncodingElement => !!(element as EncodingElement)?.value

const collectElements = (
  acc: EncodingElement[],
  scale: StrokeDashScale | ShapeScale,
  type: EncodingType
): void => {
  const { domain, range } = scale
  for (const [i, element] of domain.entries()) {
    const child = {
      label: element,
      type,
      value: range[i]
    }
    acc.push(child as EncodingElement)
  }
}

export const collectEncodingElements = (
  path: string,
  multiSourceEncoding: MultiSourceEncoding
): EncodingElement[] => {
  const encoding = multiSourceEncoding[path]

  if (!encoding) {
    return []
  }

  const { strokeDash } = encoding
  const acc: EncodingElement[] = []
  if (strokeDash) {
    collectElements(acc, strokeDash.scale, EncodingType.STROKE_DASH)
  }

  const { shape } = encoding

  if (shape) {
    collectElements(acc, shape.scale, EncodingType.SHAPE)
  }

  return acc
}

const formatError = (acc: string[]): string | undefined => {
  if (acc.length === 0) {
    return
  }

  acc.sort()
  acc.unshift('Errors\n|||\n|--|--|')

  return acc.join('\n')
}

export const collectPathErrorsTable = (
  errors: { rev: string; msg: string }[]
): string | undefined => {
  const acc = new Set<string>()
  for (const error of errors) {
    const { msg, rev } = error

    const row = `| ${truncate(rev, EXPERIMENT_WORKSPACE_ID.length)} | ${msg} |`

    acc.add(row)
  }
  return formatError([...acc])
}
