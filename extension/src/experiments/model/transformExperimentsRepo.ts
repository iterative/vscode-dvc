import { collectExperiments } from './collectFromRepo'
import { collectParamsAndMetrics } from './collectParamsAndMetrics'
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
  const { workspace, branches, experimentsByBranch, checkpointsByTip } =
    collectExperiments(data)

  const paramsAndMetrics = collectParamsAndMetrics(data)

  return {
    branches,
    checkpointsByTip,
    experimentsByBranch,
    paramsAndMetrics,
    workspace
  }
}
