import { isImagePlot } from '../webview/contract'
import { PlotsOutput } from '../../cli/reader'
import { getParent, getPath, getPathArray } from '../../fileSystem/util'

export const collectPaths = (
  data: PlotsOutput
): { templates: string[]; comparison: string[] } => {
  const { comparison, plots: templates } = Object.entries(data).reduce(
    (acc, [path, plots]) => {
      plots.forEach(plot => {
        if (isImagePlot(plot)) {
          acc.comparison.add(path)
          return
        }
        acc.plots.add(path)
      })
      return acc
    },
    { comparison: new Set<string>(), plots: new Set<string>() }
  )
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

export const collectPathsWithParents = (data: PlotsOutput): PlotPath[] => {
  const included = new Set<string>()
  const pathsWithParents: PlotPath[] = []

  const plotPaths = Object.keys(data)

  plotPaths.forEach(path => {
    const pathArray = getPathArray(path)

    for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
      const path = getPath(pathArray, reverseIdx)
      if (included.has(path)) {
        continue
      }

      pathsWithParents.push({
        hasChildren: reverseIdx !== pathArray.length,
        parentPath: getParent(pathArray, reverseIdx),
        path
      })
      included.add(path)
    }
  })

  return pathsWithParents
}
