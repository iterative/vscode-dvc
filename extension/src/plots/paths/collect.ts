import { isImagePlot, Plot } from '../webview/contract'
import { PlotsOutput } from '../../cli/reader'
import { getParent, getPath, getPathArray } from '../../fileSystem/util'

const collectPathByType = (
  comparison: Set<string>,
  templates: Set<string>,
  path: string,
  plots: Plot[]
) => {
  for (const plot of plots) {
    if (isImagePlot(plot)) {
      comparison.add(path)
      continue
    }
    templates.add(path)
  }
}

export const collectPaths = (
  data: PlotsOutput
): { templates: string[]; comparison: string[] } => {
  const comparison = new Set<string>()
  const templates = new Set<string>()

  for (const [path, plots] of Object.entries(data)) {
    collectPathByType(comparison, templates, path, plots)
  }
  return {
    comparison: [...comparison].sort(),
    templates: [...templates].sort()
  }
}

type PlotPath = {
  path: string
  parentPath: string | undefined
  hasChildren: boolean
}

const collectSubPathsWithParents = (
  pathsWithParents: PlotPath[],
  included: Set<string>,
  pathArray: string[],
  reverseIdx: number
) => {
  const path = getPath(pathArray, reverseIdx)
  if (included.has(path)) {
    return
  }

  pathsWithParents.push({
    hasChildren: reverseIdx !== pathArray.length,
    parentPath: getParent(pathArray, reverseIdx),
    path
  })
  included.add(path)
}

export const collectPathsWithParents = (data: PlotsOutput): PlotPath[] => {
  const included = new Set<string>()
  const pathsWithParents: PlotPath[] = []

  const plotPaths = Object.keys(data)

  for (const path of plotPaths) {
    const pathArray = getPathArray(path)

    for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
      collectSubPathsWithParents(
        pathsWithParents,
        included,
        pathArray,
        reverseIdx
      )
    }
  }

  return pathsWithParents
}
