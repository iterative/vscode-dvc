import { isImagePlot, Plot, TemplatePlotGroup } from '../webview/contract'
import { PlotsOutput } from '../../cli/dvc/contract'
import { getParent, getPath, getPathArray } from '../../fileSystem/util'
import { splitMatchedOrdered, definedAndNonEmpty } from '../../util/array'
import { isMultiViewPlot } from '../vega/util'
import { createTypedAccumulator } from '../../util/object'
import {
  ShapeScale,
  ShapeValue,
  StrokeDashScale,
  StrokeDashValue
} from '../multiSource/constants'
import { MultiSourceEncoding } from '../multiSource/collect'

export enum PathType {
  COMPARISON = 'comparison',
  TEMPLATE_MULTI = 'template-multi',
  TEMPLATE_SINGLE = 'template-single'
}

export type PlotPath = {
  label: string
  path: string
  type?: Set<PathType>
  parentPath: string | undefined
  hasChildren: boolean
  revisions: Set<string>
}

const collectType = (plots: Plot[]) => {
  const type = new Set<PathType>()

  for (const plot of plots) {
    if (isImagePlot(plot)) {
      type.add(PathType.COMPARISON)
      continue
    }

    isMultiViewPlot(plot.content)
      ? type.add(PathType.TEMPLATE_MULTI)
      : type.add(PathType.TEMPLATE_SINGLE)
  }

  return type
}

const getType = (
  data: PlotsOutput,
  hasChildren: boolean,
  path: string
): Set<PathType> | undefined => {
  if (hasChildren) {
    return
  }

  const plots = data[path]
  if (!definedAndNonEmpty(plots)) {
    return
  }

  return collectType(plots)
}

const collectOrderedPath = (
  acc: PlotPath[],
  data: PlotsOutput,
  revisions: Set<string>,
  pathArray: string[],
  idx: number
) => {
  const path = getPath(pathArray, idx)

  if (acc.some(({ path: existingPath }) => existingPath === path)) {
    return acc.map(existing =>
      existing.path === path
        ? {
            ...existing,
            revisions: new Set([...existing.revisions, ...revisions])
          }
        : existing
    )
  }

  const hasChildren = idx !== pathArray.length

  const plotPath: PlotPath = {
    hasChildren,
    label: pathArray[idx - 1],
    parentPath: getParent(pathArray, idx),
    path,
    revisions
  }

  const type = getType(data, hasChildren, path)
  if (type) {
    plotPath.type = type
  }

  acc.push(plotPath)
  return acc
}

const collectPathRevisions = (
  data: PlotsOutput,
  path: string,
  cliIdToLabel: { [id: string]: string }
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Set<string> => {
  const revisions = new Set<string>()
  const pathData = data[path]
  for (const plot of pathData) {
    if (isImagePlot(plot)) {
      if (plot.revisions?.[0]) {
        revisions.add(cliIdToLabel[plot.revisions[0]] || plot.revisions[0])
      }
    } else {
      for (const [revision, datapoints] of Object.entries(
        plot?.datapoints || {}
      )) {
        if (datapoints.length > 0) {
          revisions.add(cliIdToLabel[revision] || revision)
        }
      }
    }
  }

  return revisions
}

export const collectPaths = (
  existingPaths: PlotPath[],
  data: PlotsOutput,
  cliIdToLabel: { [id: string]: string } = {}
): PlotPath[] => {
  let acc: PlotPath[] = [...existingPaths]

  const paths = Object.keys(data)

  for (const path of paths) {
    // need to remove collected revisions as they might change (workspace) => pass in revs and is workspace is present remove the key for each entry.
    const revisions = collectPathRevisions(data, path, cliIdToLabel)

    if (revisions.size === 0) {
      continue
    }

    const pathArray = getPathArray(path)

    for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
      acc = collectOrderedPath(acc, data, revisions, pathArray, reverseIdx)
    }
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
type PlotsScale = typeof PlotsScale[keyof typeof PlotsScale]
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

export type EncodingElement =
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
  collectElements(acc, strokeDash.scale, EncodingType.STROKE_DASH)

  const { shape } = encoding

  if (shape) {
    collectElements(acc, shape.scale, EncodingType.SHAPE)
  }

  return acc
}
