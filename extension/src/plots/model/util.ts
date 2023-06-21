import { getDataFromColumnPaths } from '../../experiments/model/util'
import { Experiment } from '../../experiments/webview/contract'
import { RevisionFirstThreeColumns } from '../webview/contract'

export const getRevisionFirstThreeColumns = (
  tooltipColumns: string[],
  experiment: Experiment
): RevisionFirstThreeColumns =>
  getDataFromColumnPaths(experiment, tooltipColumns).map(
    ({ columnPath: path, value, type }) => ({
      path,
      type,
      value
    })
  )
