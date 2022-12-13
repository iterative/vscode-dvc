import { getDataFromColumnPath } from '../../experiments/model/util'
import { Experiment } from '../../experiments/webview/contract'

export const getRevisionFirstThreeColumns = (
  firstThreeColumns: string[],
  experiment: Experiment
) => {
  const columns: Array<{ path: string; value: string }> = []
  firstThreeColumns.map(path => {
    const { value, splitUpPath } = getDataFromColumnPath(experiment, path)
    const [type] = splitUpPath
    if (value) {
      columns.push({
        path: path.slice(type.length + 1) || path,
        value
      })
    }
  })
  return columns
}
