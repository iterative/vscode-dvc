import { getDataFromColumnPaths } from '../../experiments/model/util'
import { Experiment } from '../../experiments/webview/contract'
import { RevisionSummaryColumns } from '../webview/contract'

export const getRevisionSummaryColumns = (
  summaryColumns: string[],
  experiment: Experiment
): RevisionSummaryColumns =>
  getDataFromColumnPaths(experiment, summaryColumns).map(
    ({ columnPath: path, value, type }) => ({
      path,
      type,
      value
    })
  )
