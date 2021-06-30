import {
  ExperimentsRepoJSONOutput,
  ExperimentsBranch,
  ExperimentsWorkspace
} from './contract'
import { collectFromRepo } from './collectFromRepo'
import { transformAndCollectFromColumnsIfAny } from './transformColumns'
import { ColumnData } from './webview/contract'

export interface TransformedExperiments {
  columns: ColumnData[]
  branches: ExperimentsBranch[]
  workspace: ExperimentsWorkspace
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
