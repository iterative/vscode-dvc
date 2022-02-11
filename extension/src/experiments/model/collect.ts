import omit from 'lodash.omit'
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
import { hasKey } from '../../util/object'

type ExperimentsObject = { [sha: string]: ExperimentFieldsOrError }

export const getLabel = (sha: string) => sha.slice(0, 7)

export const isCheckpoint = (
  checkpointTip: string | undefined,
  sha: string
): checkpointTip is string => !!(checkpointTip && checkpointTip !== sha)

const getId = (sha: string, experimentsFields: ExperimentFields): string => {
  const { name, checkpoint_tip } = experimentsFields

  if (isCheckpoint(checkpoint_tip, sha)) {
    return sha
  }

  return name || sha
}

const getDisplayNameOrParent = (
  sha: string,
  experimentsObject: ExperimentsObject
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
    return `(${getLabel(parentTip)})`
  }
  if (name) {
    return `[${name}]`
  }
}

const getCheckpointTipId = (
  checkpointTip: string | undefined,
  experimentsObject: ExperimentsObject
): string | undefined => {
  if (!checkpointTip) {
    return
  }
  return experimentsObject[checkpointTip]?.data?.name
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

const transformExperimentData = (
  id: string,
  experimentFields: ExperimentFields,
  label: string | undefined,
  sha?: string,
  displayNameOrParent?: string
): Experiment => {
  const experiment = {
    id,
    ...omit(experimentFields, ['metrics', 'params']),
    label
  } as Experiment

  if (displayNameOrParent) {
    experiment.displayNameOrParent = displayNameOrParent
  }

  if (sha) {
    experiment.sha = sha
  }

  transformMetricsAndParams(experiment, experimentFields)

  return experiment
}

const transformExperimentOrCheckpointData = (
  sha: string,
  experimentFields: ExperimentFields,
  displayNameOrParent: string | undefined
) =>
  transformExperimentData(
    getId(sha, experimentFields),
    experimentFields,
    getLabel(sha),
    sha,
    displayNameOrParent
  )

const collectExperimentOrCheckpoint = (
  acc: ExperimentsAccumulator,
  experiment: Experiment,
  branchName: string,
  checkpointTipId: string | undefined
) => {
  const { checkpoint_tip: checkpointTip, sha } = experiment
  if (isCheckpoint(checkpointTip, sha as string)) {
    if (!checkpointTipId) {
      return
    }
    addToMapArray(acc.checkpointsByTip, checkpointTipId, experiment)
    return
  }
  addToMapArray(acc.experimentsByBranch, branchName, experiment)
}

const collectFromExperimentsObject = (
  acc: ExperimentsAccumulator,
  experimentsObject: ExperimentsObject,
  branchName: string
) => {
  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experimentFields = experimentData.data
    if (!experimentFields) {
      continue
    }

    const experiment = transformExperimentOrCheckpointData(
      sha,
      experimentFields,
      getDisplayNameOrParent(sha, experimentsObject)
    )

    if (!experiment) {
      continue
    }
    const checkpointTipId = getCheckpointTipId(
      experiment.checkpoint_tip,
      experimentsObject
    )
    collectExperimentOrCheckpoint(acc, experiment, branchName, checkpointTipId)
  }
}

const collectFromBranchesObject = (
  acc: ExperimentsAccumulator,
  branchesObject: { [name: string]: ExperimentsBranchOutput }
) => {
  for (const [branchSha, { baseline, ...experimentsObject }] of Object.entries(
    branchesObject
  )) {
    const experimentFields = baseline.data
    if (!experimentFields) {
      continue
    }

    const branch = transformExperimentData(
      experimentFields.name as string,
      experimentFields,
      experimentFields.name,
      branchSha
    )

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject, branch.label)

      acc.branches.push(branch)
    }
  }
}

export const collectExperiments = (
  data: ExperimentsOutput
): ExperimentsAccumulator => {
  const { workspace, ...branchesObject } = data
  const workspaceId = 'workspace'

  const workspaceFields = workspace.baseline.data
  const workspaceBaseline = workspaceFields
    ? transformExperimentData(workspaceId, workspaceFields, workspaceId)
    : undefined

  const acc = new ExperimentsAccumulator(workspaceBaseline)

  collectFromBranchesObject(acc, branchesObject)
  return acc
}

export enum Status {
  SELECTED = 1,
  UNSELECTED = 0
}

const collectStatus = (
  acc: Record<string, Status>,
  experiment: Experiment,
  status: Record<string, Status>,
  defaultStatus: Status
) => {
  const { id, queued } = experiment
  if (id && !queued) {
    acc[id] = hasKey(status, id) ? status[id] : defaultStatus
  }
}

export const collectStatuses = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>,
  status: Record<string, Status>
) => {
  return experiments.reduce((acc, experiment) => {
    collectStatus(acc, experiment, status, Status.SELECTED)

    checkpointsByTip.get(experiment.id)?.reduce((acc, checkpoint) => {
      collectStatus(acc, checkpoint, status, Status.UNSELECTED)
      return acc
    }, acc)

    return acc
  }, {} as Record<string, Status>)
}
