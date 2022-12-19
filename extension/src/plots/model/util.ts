import { getDataFromColumnPath } from '../../experiments/model/util'
import { Experiment } from '../../experiments/webview/contract'
import { RevisionFirstThreeColumns } from '../webview/contract'

export const getRevisionFirstThreeColumns = (
  firstThreeColumns: string[],
  experiment: Experiment
) => {
  const columns: RevisionFirstThreeColumns = []
  for (const path of firstThreeColumns) {
    const { value, splitUpPath, fullValue } = getDataFromColumnPath(
      experiment,
      path
    )
    const type = splitUpPath[0]

    if (value) {
      columns.push({
        fullValue,
        path: path.slice(type.length + 1) || path,
        type,
        value
      })
    }
  }
  return columns
}
