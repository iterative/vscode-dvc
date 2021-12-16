import { ExperimentsAccumulator } from './accumulator'
import { reduceParamsAndMetrics } from '../paramsAndMetrics/reduce'
import { Experiment } from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentFields,
  ExperimentsBranchOutput,
  ExperimentsOutput
} from '../../cli/reader'
import { addToMapArray } from '../../util/map'

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

const transformExperimentLikeData = (
  sha: string,
  experimentFieldsOrError: ExperimentFieldsOrError
): Experiment | undefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const experiment = {
    id: sha,
    ...experimentFields
  } as Experiment

  transformParamsAndMetrics(experiment, experimentFields)

  return experiment
}

const transformExperimentData = (
  sha: string,
  experimentFieldsOrError: ExperimentFieldsOrError
): Experiment | undefined => {
  const transformedExperiment = transformExperimentLikeData(
    sha,
    experimentFieldsOrError
  )
  if (transformedExperiment) {
    transformedExperiment.displayName = transformedExperiment.id.slice(0, 7)
    return transformedExperiment
  }
}

const transformBaselineData = (
  sha: string,
  experimentFieldsOrError: ExperimentFieldsOrError
): Experiment | undefined => {
  const transformedExperiment = transformExperimentLikeData(
    sha,
    experimentFieldsOrError
  )
  if (transformedExperiment) {
    transformedExperiment.displayName =
      transformedExperiment.name || transformedExperiment.id.slice(0, 7)
    return transformedExperiment
  }
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
  branchesObject: { [name: string]: ExperimentsBranchOutput }
) => {
  for (const [branchSha, { baseline, ...experimentsObject }] of Object.entries(
    branchesObject
  )) {
    const branch = transformBaselineData(branchSha, baseline)

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject, branch.displayName)

      acc.branches.push(branch)
    }
  }
}

export const collectExperiments = (
  data: ExperimentsOutput
): ExperimentsAccumulator => {
  const { workspace, ...branchesObject } = data
  const workspaceBaseline = transformExperimentLikeData(
    'workspace',
    workspace.baseline
  ) as Experiment
  if (workspaceBaseline) {
    workspaceBaseline.displayName = workspaceBaseline.id
  }

  const acc = new ExperimentsAccumulator(workspaceBaseline)

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
