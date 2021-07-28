import { ExperimentsAccumulator } from './accumulator'
import { Experiment, ParamsOrMetrics } from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentFields,
  ExperimentsBranchJSONOutput,
  ExperimentsRepoJSONOutput,
  ValueTreeRoot
} from '../../cli/reader'

const addToMapArray = <K = string, V = unknown>(
  map: Map<K, V[]>,
  key: K,
  value: V
): void => {
  const existingArray = map.get(key)
  if (existingArray) {
    existingArray.push(value)
  } else {
    const newArray = [value]
    map.set(key, newArray)
  }
}

const collectExperimentOrCheckpoint = (
  acc: ExperimentsAccumulator,
  experiment: Experiment,
  branchName: string
) => {
  const { checkpoint_tip, id } = experiment
  if (checkpoint_tip && checkpoint_tip !== id) {
    addToMapArray(acc.checkpointsByTip, checkpoint_tip, experiment)
  } else {
    addToMapArray(acc.experimentsByBranch, branchName, experiment)
  }
}

const reduceParamsOrMetrics = (paramsOrMetrics?: ValueTreeRoot) => {
  if (paramsOrMetrics) {
    return Object.entries(paramsOrMetrics).reduce(
      (paramsOrMetrics, [file, dataOrError]) => {
        const data = dataOrError?.data
        if (data) {
          paramsOrMetrics[file] = data
        }
        return paramsOrMetrics
      },
      {} as ParamsOrMetrics
    )
  }
}

const reduceParamsAndMetrics = (
  experiment: ExperimentFields
): {
  metrics: ParamsOrMetrics | undefined
  params: ParamsOrMetrics | undefined
} => ({
  metrics: reduceParamsOrMetrics(experiment.metrics),
  params: reduceParamsOrMetrics(experiment.params)
})

const transformParamsAndMetrics = (
  experiment: Experiment,
  experimentFields: ExperimentFields
) => {
  const { metrics, params } = reduceParamsAndMetrics(experimentFields)

  if (metrics) {
    experiment.metrics = metrics
  }
  if (params) {
    experiment.params = params
  }
}

const transformExperimentData = (
  sha: string,
  experimentFieldsOrError: ExperimentFieldsOrError,
  fallbackDisplayNameLength = 7
): Experiment | undefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const experiment = {
    id: sha,
    ...experimentFields,
    displayName:
      experimentFields?.name || sha.slice(0, fallbackDisplayNameLength)
  } as Experiment

  transformParamsAndMetrics(experiment, experimentFields)

  return experiment
}

const collectFromExperimentsObject = (
  acc: ExperimentsAccumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError },
  branchName: string
) => {
  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experiment = transformExperimentData(sha, experimentData)

    if (experiment) {
      collectExperimentOrCheckpoint(acc, experiment, branchName)
    }
  }
}

const collectFromBranchesObject = (
  acc: ExperimentsAccumulator,
  branchesObject: { [name: string]: ExperimentsBranchJSONOutput }
) => {
  for (const [branchSha, { baseline, ...experimentsObject }] of Object.entries(
    branchesObject
  )) {
    const branch = transformExperimentData(branchSha, baseline)

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject, branch.displayName)

      acc.branches.push(branch)
    }
  }
}

export const collectExperiments = (
  data: ExperimentsRepoJSONOutput
): ExperimentsAccumulator => {
  const { workspace, ...branchesObject } = data
  const workspaceBaseline = transformExperimentData(
    'workspace',
    workspace.baseline,
    9
  )

  const acc = new ExperimentsAccumulator(workspaceBaseline)

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
