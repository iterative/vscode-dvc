import { isImagePlot } from '../webview/contract'
import { PlotsOutput } from '../../cli/reader'
import { getParent, getPath, getPathArray } from '../../fileSystem/util'
import { definedAndNonEmpty } from '../../util/array'

export type PlotPath = {
  path: string
  type?: Set<'comparison' | 'template'>
  parentPath: string | undefined
  hasChildren: boolean
}

const getType = (
  data: PlotsOutput,
  hasChildren: boolean,
  path: string
): Set<'comparison' | 'template'> | undefined => {
  if (hasChildren) {
    return
  }

  const plots = data[path]
  if (!definedAndNonEmpty(plots)) {
    return
  }

  const type = new Set<'comparison' | 'template'>()

  for (const plot of plots) {
    if (isImagePlot(plot)) {
      type.add('comparison')
      continue
    }
    type.add('template')
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
