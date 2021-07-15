import { collectFromRepo, RunningOrQueued } from './collectFromRepo'
import { transformAndCollectFromColumnsIfAny } from './transformColumns'
import { ColumnData, Experiment } from './webview/contract'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

interface TransformedExperiments {
  columns: ColumnData[]
  experiments: Experiment[]
  workspace: Experiment
  runningOrQueued: Map<string, RunningOrQueued>
}

export const transformExperimentsRepo = (
  data: ExperimentsRepoJSONOutput
): TransformedExperiments => {
  const { metricsMap, paramsMap, experiments, workspace, runningOrQueued } =
    collectFromRepo(data)

  return {
    columns: [
      ...transformAndCollectFromColumnsIfAny(paramsMap),
      ...transformAndCollectFromColumnsIfAny(metricsMap)
    ],
    experiments,
    runningOrQueued,
    workspace
  }
}
