import { collectFromRepo, RunningOrQueued } from './collectFromRepo'
import { transformAndCollectFromColumnsIfAny } from './transformColumns'
import { ColumnData, Experiment } from './webview/contract'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

interface TransformedExperiments {
  columns: ColumnData[]
  branches: Experiment[]
  workspace: Experiment
  runningOrQueued: Map<string, RunningOrQueued>
}

export const transformExperimentsRepo = (
  data: ExperimentsRepoJSONOutput
): TransformedExperiments => {
  const { metricsMap, paramsMap, branches, workspace, runningOrQueued } =
    collectFromRepo(data)

  return {
    branches,
    columns: [
      ...transformAndCollectFromColumnsIfAny(paramsMap),
      ...transformAndCollectFromColumnsIfAny(metricsMap)
    ],
    runningOrQueued,
    workspace
  }
}
