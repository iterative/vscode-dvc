import {
  ExperimentsRepoJSONOutput,
  ExperimentsBranch,
  ExperimentsWorkspace
} from './contract'
import { collectFromRepo } from './collectFromRepo'
import { transformAndCollectFromColumnsIfAny } from './transformColumns'
import { ColumnData } from './webview/contract'

export interface TransformedExperiments {
  metrics?: ColumnData[]
  params?: ColumnData[]
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
    metrics: transformAndCollectFromColumnsIfAny(metricsMap),
    params: transformAndCollectFromColumnsIfAny(paramsMap),
    workspace
  } as TransformedExperiments
}
