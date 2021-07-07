import { collectFromRepo } from './collectFromRepo'
import { transformAndCollectFromColumnsIfAny } from './transformColumns'
import { ColumnData, Experiment } from './webview/contract'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

interface TransformedExperiments {
  columns: ColumnData[]
  branches: Experiment[]
  workspace: Experiment
}

export const transformExperimentsRepo = (
  data: ExperimentsRepoJSONOutput
): TransformedExperiments => {
  const { metricsMap, paramsMap, branches, workspace } = collectFromRepo(data)

  return {
    branches,
    columns: [
      ...transformAndCollectFromColumnsIfAny(paramsMap),
      ...transformAndCollectFromColumnsIfAny(metricsMap)
    ],
    workspace
  }
}
