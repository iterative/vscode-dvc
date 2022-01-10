import { ExperimentsAccumulator } from './accumulator'
import { reduceMetricsAndParams } from '../metricsAndParams/reduce'
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

const transformMetricsAndParams = (
  experiment: Experiment,
  experimentFields: ExperimentFields
) => {
  const { metrics, params } = reduceMetricsAndParams(experimentFields)

  if (metrics) {
    experiment.metrics = metrics
  }
  if (params) {
    experiment.params = params
  }
}

export const getDisplayName = (
  sha: string,
  name: string | undefined,
  isBranch: boolean,
  fallbackDisplayNameLength = 7
): string => {
  if (isBranch && name) {
    return name
  }
  if (name) {
    return sha.slice(0, fallbackDisplayNameLength) + ` [${name}]`
  }
  return sha.slice(0, fallbackDisplayNameLength)
}

const transformExperimentData = (
  sha: string,
  experimentFieldsOrError: ExperimentFieldsOrError,
  isBranch: boolean,
  fallbackDisplayNameLength = 7
): Experiment | undefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const name = experimentFields?.name

  const experiment = {
    id: sha,
    ...experimentFields,
    displayName: getDisplayName(sha, name, isBranch, fallbackDisplayNameLength)
  } as Experiment

  transformMetricsAndParams(experiment, experimentFields)

  return experiment
}

const collectFromExperimentsObject = (
  acc: ExperimentsAccumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError },
  branchName: string
) => {
  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experiment = transformExperimentData(sha, experimentData, false)

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
    const branch = transformExperimentData(branchSha, baseline, true)

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
  const workspaceBaseline = transformExperimentData(
    'workspace',
    workspace.baseline,
    true,
    9
  )

  const acc = new ExperimentsAccumulator(workspaceBaseline)

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
