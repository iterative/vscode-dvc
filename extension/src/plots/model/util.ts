import { getDataFromColumnPaths } from '../../experiments/model/util'
import { Experiment } from '../../experiments/webview/contract'
import { RevisionFirstThreeColumns } from '../webview/contract'

export const getRevisionFirstThreeColumns = (
  firstThreeColumns: string[],
  experiment: Experiment
): RevisionFirstThreeColumns =>
  getDataFromColumnPaths(experiment, firstThreeColumns).map(
    ({ columnPath: path, value, type }) => ({
      path,
      type,
      value
    })
  )
