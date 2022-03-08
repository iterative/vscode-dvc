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
  const { paths } = Object.keys(data).reduce(
    (acc, path) => {
      const pathArray = getPathArray(path)
      pathArray.reduce((acc, _, i) => {
        const reverseIdx = pathArray.length - i
        const path = getPath(pathArray, reverseIdx)
        if (acc.included.has(path)) {
          return acc
        }

        acc.paths.push({
          hasChildren: !!i,
          parentPath: getParent(pathArray, reverseIdx),
          path
        })
        acc.included.add(path)

        return acc
      }, acc)

      return acc
    },
    {
      included: new Set<string>(),
      paths: [] as PlotPath[]
    }
  )
  return paths
}
