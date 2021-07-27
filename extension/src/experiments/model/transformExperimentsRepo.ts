import { collectFromRepo } from './collectFromRepo'
import { transformAndCollectIfAny } from './transformParamsAndMetrics'
import { ParamOrMetric, Experiment } from '../webview/contract'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'

interface TransformedExperiments {
  paramsAndMetrics: ParamOrMetric[]
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
    experimentsByBranch,
    paramsAndMetrics: [
      ...transformAndCollectIfAny(paramsMap),
      ...transformAndCollectIfAny(metricsMap)
    ],
    workspace
  }
}
