import {
  ExperimentsRepoJSONOutput,
  ExperimentsBranch,
  ExperimentsWorkspace
} from './contract'
import { collectFromRepo, ColumnAggregateData } from './collectFromRepo'
import { transformAndCollectFromColumnsIfAny } from './transformColumns'

export interface Column extends ColumnAggregateData {
  name: string
  types?: string[]
  childColumns?: Column[]
  ancestors?: string[]
}

export interface TransformedExperiments {
  columns: { metrics: Column[]; params: Column[] }
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
    columns: {
      metrics: transformAndCollectFromColumnsIfAny(metricsMap),
      params: transformAndCollectFromColumnsIfAny(paramsMap)
    },
    workspace
  } as TransformedExperiments
}
