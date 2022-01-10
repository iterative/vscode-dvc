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
  secondaryName: string | undefined,
  fallbackDisplayNameLength = 7
): string => {
  return [sha.slice(0, fallbackDisplayNameLength), secondaryName]
    .filter(Boolean)
    .join(' ')
}

const transformExperimentData = (
  sha: string,
  experimentFieldsOrError: ExperimentFieldsOrError,
  displayName?: string
): Experiment | undefined => {
  const experimentFields = experimentFieldsOrError.data
  if (!experimentFields) {
    return
  }

  const experiment = {
    id: sha,
    ...experimentFields,
    displayName
  } as Experiment

  transformMetricsAndParams(experiment, experimentFields)

  return experiment
}

const getSecondaryName = (
  sha: string,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
): string | undefined => {
  const experiment = experimentsObject[sha]?.data
  if (!experiment) {
    return
  }

  const { checkpoint_parent: parentTip, name } = experiment
  if (
    parentTip &&
    experimentsObject[parentTip]?.data?.checkpoint_tip === parentTip
  ) {
    return `(${parentTip.slice(0, 7)})`
  }
  if (name) {
    return `[${name}]`
  }
}

const collectFromExperimentsObject = (
  acc: ExperimentsAccumulator,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError },
  branchName: string
) => {
  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const displayName = getDisplayName(
      sha,
      getSecondaryName(sha, experimentsObject)
    )
    const experiment = transformExperimentData(sha, experimentData, displayName)

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
    const branch = transformExperimentData(
      branchSha,
      baseline,
      baseline?.data?.name
    )

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
  const workspaceId = 'workspace'
  const workspaceBaseline = transformExperimentData(
    workspaceId,
    workspace.baseline,
    workspaceId
  )

  const acc = new ExperimentsAccumulator(workspaceBaseline)

  collectFromBranchesObject(acc, branchesObject)
  return acc
}
