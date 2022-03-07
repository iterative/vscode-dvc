import { isImagePlot } from '../webview/contract'
import { PlotsOutput } from '../../cli/reader'

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
