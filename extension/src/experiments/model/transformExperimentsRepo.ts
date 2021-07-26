import { collectFromRepo } from './collectFromRepo'
import { transformAndCollectFromColumnsIfAny } from './transformColumns'
import { ColumnData, Experiment } from '../webview/contract'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'

interface TransformedExperiments {
  columns: ColumnData[]
  branches: Experiment[]
  experimentsByBranch: Map<string, Experiment[]>
  checkpointsByTip: Map<string, Experiment[]>
  workspace: Experiment
}

export const transformExperimentsRepo = (
  data: ExperimentsRepoJSONOutput
): TransformedExperiments => {
  const {
    metricsMap,
    paramsMap,
    workspace,
    branches,
    experimentsByBranch,
    checkpointsByTip
  } = collectFromRepo(data)

  return {
    branches,
    checkpointsByTip,
    columns: [
      ...transformAndCollectFromColumnsIfAny(paramsMap),
      ...transformAndCollectFromColumnsIfAny(metricsMap)
    ],
    experimentsByBranch,
    workspace
  }
}
