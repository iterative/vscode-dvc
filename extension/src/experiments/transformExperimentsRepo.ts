import { ExperimentsRepoJSONOutput, Experiment } from './types'
import { collectFromRepo } from './collectFromRepo'
import { transformAndCollectFromColumnsIfAny } from './transformColumns'
import { ColumnData } from './webview/contract'

export interface TransformedExperiments {
  columns: ColumnData[]
  branches: Experiment[]
  workspace: Experiment
}

export const transformExperimentsRepo = (
  tableData: ExperimentsRepoJSONOutput
): TransformedExperiments => {
  const { metricsMap, paramsMap, branches, workspace } =
    collectFromRepo(tableData)

  return {
    branches,
    columns: [
      ...transformAndCollectFromColumnsIfAny(paramsMap, 'params'),
      ...transformAndCollectFromColumnsIfAny(metricsMap, 'metrics')
    ],
    workspace
  }
}
