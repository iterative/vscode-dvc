import { TopLevelSpec } from 'vega-lite'
import { isImagePlot, PlotsGroup } from '../webview/contract'
import { PlotsOutput } from '../../cli/reader'
import { getParent, getPath, getPathArray } from '../../fileSystem/util'
import { definedAndNonEmpty } from '../../util/array'
import { isMultiViewPlot } from '../vega/util'

export enum PathType {
  COMPARISON = 'comparison',
  TEMPLATE_MULTI = 'template-multi',
  TEMPLATE_SINGLE = 'template-single'
}

export type PlotPath = {
  path: string
  type?: Set<PathType>
  parentPath: string | undefined
  hasChildren: boolean
}

const getType = (
  data: PlotsOutput,
  hasChildren: boolean,
  path: string
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Set<PathType> | undefined => {
  if (hasChildren) {
    return
  }

  const plots = data[path]
  if (!definedAndNonEmpty(plots)) {
    return
  }

  const type = new Set<PathType>()

  for (const plot of plots) {
    if (isImagePlot(plot)) {
      type.add(PathType.COMPARISON)
      continue
    }

    isMultiViewPlot(plot.content as TopLevelSpec)
      ? type.add(PathType.TEMPLATE_MULTI)
      : type.add(PathType.TEMPLATE_SINGLE)
  }

  return type
}

type PathAccumulator = {
  plotPaths: PlotPath[]
  included: Set<string>
}

const collectPath = (
  acc: PathAccumulator,
  data: PlotsOutput,
  pathArray: string[],
  idx: number
) => {
  const path = getPath(pathArray, idx)

  if (acc.included.has(path)) {
    return
  }

  const hasChildren = idx !== pathArray.length

  const plotPath: PlotPath = {
    hasChildren,
    parentPath: getParent(pathArray, idx),
    path
  }

  const type = getType(data, hasChildren, path)
  if (type) {
    plotPath.type = type
  }

  acc.plotPaths.push(plotPath)
  acc.included.add(path)
}

export const collectPaths = (data: PlotsOutput): PlotPath[] => {
  const acc: PathAccumulator = { included: new Set<string>(), plotPaths: [] }

  const paths = Object.keys(data)

  for (const path of paths) {
    const pathArray = getPathArray(path)

    for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
      collectPath(acc, data, pathArray, reverseIdx)
    }
  }

  return acc.plotPaths
}

export type TemplateOrder = { paths: string[]; group: PlotsGroup }[]

const collectFromRemaining = (
  acc: string[],
  paths: string[],
  remaining: string[]
) => {
  for (const path of paths) {
    if (remaining.includes(path)) {
      remaining = remaining.filter(remainingPath => remainingPath !== path)
      acc.push(path)
    }
  }
  return remaining
}

const collectExistingOrder = (
  newTemplateOrder: TemplateOrder,
  singleViewPaths: string[],
  multiViewPaths: string[],
  existingTemplateOrder: TemplateOrder
) => {
  let remainingSingleView = [...singleViewPaths]
  let remainingMultiView = [...multiViewPaths]
  for (const templateGroup of existingTemplateOrder) {
    const acc: string[] = []
    const { group, paths } = templateGroup
    if (group === PlotsGroup.MULTI_VIEW) {
      remainingMultiView = collectFromRemaining(acc, paths, remainingMultiView)
    }
    if (group === PlotsGroup.SINGLE_VIEW) {
      remainingSingleView = collectFromRemaining(
        acc,
        paths,
        remainingSingleView
      )
    }
    newTemplateOrder.push({ group, paths: acc })
  }
  return { remainingMultiView, remainingSingleView }
}

const collectUnordered = (
  newTemplateOrder: TemplateOrder,
  remaining: string[],
  group: PlotsGroup
) => {
  if (definedAndNonEmpty(remaining)) {
    const acc: string[] = []
    for (const path of remaining) {
      acc.push(path)
    }

    newTemplateOrder.push({
      group,
      paths: acc
    })
  }
}

export const collectTemplateOrder = (
  singleViewPaths: string[],
  multiViewPaths: string[],
  existingTemplateOrder: TemplateOrder
): TemplateOrder => {
  const newTemplateOrder: TemplateOrder = []

  const { remainingSingleView, remainingMultiView } = collectExistingOrder(
    newTemplateOrder,
    singleViewPaths,
    multiViewPaths,
    existingTemplateOrder
  )

  collectUnordered(
    newTemplateOrder,
    remainingSingleView,
    PlotsGroup.SINGLE_VIEW
  )
  collectUnordered(newTemplateOrder, remainingMultiView, PlotsGroup.MULTI_VIEW)

  return newTemplateOrder
}
