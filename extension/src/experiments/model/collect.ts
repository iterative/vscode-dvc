import omit from 'lodash.omit'
import { ExperimentsAccumulator } from './accumulator'
import { getWorkspaceColor } from './colors'
import { canSelect, Status, Statuses } from './status'
import { extractMetricsAndParams } from '../metricsAndParams/extract'
import { Experiment } from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentFields,
  ExperimentsBranchOutput,
  ExperimentsOutput
} from '../../cli/reader'
import { addToMapArray, flattenMapValues } from '../../util/map'
import { hasKey } from '../../util/object'

type ExperimentsObject = { [sha: string]: ExperimentFieldsOrError }

const getShortSha = (sha: string) => sha.slice(0, 7)

export const isCheckpoint = (
  checkpointTip: string | undefined,
  sha: string
): checkpointTip is string => !!(checkpointTip && checkpointTip !== sha)

const getExperimentId = (
  sha: string,
  experimentsFields: ExperimentFields
): string => {
  const { name, checkpoint_tip } = experimentsFields

  if (isCheckpoint(checkpoint_tip, sha)) {
    return sha
  }

  return name || sha
}

const getDisplayNameOrParent = (
  sha: string,
  branchSha: string,
  experimentsObject: { [sha: string]: ExperimentFieldsOrError }
): string | undefined => {
  const experiment = experimentsObject[sha]?.data
  if (!experiment) {
    return
  }

  const {
    checkpoint_parent: checkpointParent,
    checkpoint_tip: checkpointTip,
    name
  } = experiment
  if (
    checkpointParent &&
    branchSha !== checkpointParent &&
    experimentsObject[checkpointParent]?.data?.checkpoint_tip !== checkpointTip
  ) {
    return `(${getShortSha(checkpointParent)})`
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

const getColor = (
  experimentColors: Map<string, string>,
  checkpointTipId: string | undefined,
  id: string
) => experimentColors.get(checkpointTipId || id)

const transformMetricsAndParams = (
  experiment: Experiment,
  experimentFields: ExperimentFields
) => {
  const { metrics, params } = extractMetricsAndParams(experimentFields)

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
  displayColor: string | undefined,
  hasCheckpoints: boolean,
  sha?: string,
  displayNameOrParent?: string
): Experiment => {
  const experiment = {
    id,
    label,
    ...omit(experimentFields, ['metrics', 'params']),
    mutable: !!(!hasCheckpoints && experimentFields.running)
  } as Experiment

  if (displayNameOrParent) {
    experiment.displayNameOrParent = displayNameOrParent
  }

  if (sha) {
    experiment.sha = sha
  }

  if (displayColor) {
    experiment.displayColor = displayColor
  }

  transformMetricsAndParams(experiment, experimentFields)

  return experiment
}

const transformExperimentOrCheckpointData = (
  sha: string,
  experimentData: ExperimentFieldsOrError,
  experimentsObject: ExperimentsObject,
  branchSha: string,
  experimentColors: Map<string, string>,
  hasCheckpoints: boolean
): {
  checkpointTipId?: string
  experiment: Experiment | undefined
} => {
  const experimentFields = experimentData.data
  if (!experimentFields) {
    return { experiment: undefined }
  }

  const checkpointTipId = getCheckpointTipId(
    experimentFields.checkpoint_tip,
    experimentsObject
  )

  const id = getExperimentId(sha, experimentFields)

  return {
    checkpointTipId,
    experiment: transformExperimentData(
      id,
      experimentFields,
      getShortSha(sha),
      getColor(experimentColors, checkpointTipId, id),
      hasCheckpoints,
      sha,
      getDisplayNameOrParent(sha, branchSha, experimentsObject)
    )
  }
}

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
  branchSha: string,
  branchName: string
) => {
  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const { checkpointTipId, experiment } = transformExperimentOrCheckpointData(
      sha,
      experimentData,
      experimentsObject,
      branchSha,
      acc.experimentColors,
      acc.hasCheckpoints
    )
    if (!experiment) {
      continue
    }

    collectExperimentOrCheckpoint(acc, experiment, branchName, checkpointTipId)
  }
}

const collectFromBranchesObject = (
  acc: ExperimentsAccumulator,
  branchesObject: { [name: string]: ExperimentsBranchOutput }
) => {
  for (const [sha, { baseline, ...experimentsObject }] of Object.entries(
    branchesObject
  )) {
    const experimentFields = baseline.data
    if (!experimentFields) {
      continue
    }

    const name = experimentFields.name as string

    const branch = transformExperimentData(
      name,
      experimentFields,
      name,
      acc.branchColors.get(name),
      acc.hasCheckpoints,
      sha
    )

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject, sha, branch.label)

      acc.branches.push(branch)
    }
  }
}

export const collectExperiments = (
  data: ExperimentsOutput,
  branchColors: Map<string, string> = new Map(),
  experimentColors: Map<string, string> = new Map(),
  hasCheckpoints = false
): ExperimentsAccumulator => {
  const { workspace, ...branchesObject } = data
  const workspaceId = 'workspace'

  const workspaceFields = workspace.baseline.data
  const workspaceBaseline = workspaceFields
    ? transformExperimentData(
        workspaceId,
        workspaceFields,
        workspaceId,
        getWorkspaceColor(),
        hasCheckpoints
      )
    : undefined

  const acc = new ExperimentsAccumulator(
    workspaceBaseline,
    branchColors,
    experimentColors,
    hasCheckpoints
  )

  collectFromBranchesObject(acc, branchesObject)
  return acc
}

const collectExperimentIds = (
  acc: {
    branchIds: string[]
    experimentIds: string[]
  },
  experimentsObject: ExperimentsObject
) => {
  for (const [sha, experimentData] of Object.entries(experimentsObject)) {
    const experimentFields = experimentData.data
    if (!experimentFields?.name) {
      continue
    }
    if (!isCheckpoint(experimentFields.checkpoint_tip, sha)) {
      acc.experimentIds.push(experimentFields.name)
    }
  }
}

export const collectBranchAndExperimentIds = (branchesObject: {
  [sha: string]: ExperimentsBranchOutput
}) => {
  const acc = { branchIds: [], experimentIds: [] } as {
    branchIds: string[]
    experimentIds: string[]
  }
  for (const { baseline, ...experimentsObject } of Object.values(
    branchesObject
  )) {
    const experimentFields = baseline.data
    if (!experimentFields?.name) {
      continue
    }

    acc.branchIds.push(experimentFields.name)

    collectExperimentIds(acc, experimentsObject)
  }
  return acc
}

const getStatus = (acc: Statuses, defaultStatus: Status) => {
  if (defaultStatus && canSelect(acc)) {
    return defaultStatus
  }

  return Status.UNSELECTED
}

const collectStatus = (
  acc: Statuses,
  experiment: Experiment,
  defaultStatus: Status
) => {
  const { id, queued } = experiment
  if (!id || queued || hasKey(acc, id)) {
    return
  }
  acc[id] = getStatus(acc, defaultStatus)
}

const collectExistingStatuses = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>,
  previousStatuses: Statuses
) => {
  const existingStatuses: Statuses = {}
  for (const experiment of [
    ...experiments,
    ...flattenMapValues(checkpointsByTip)
  ]) {
    const { id } = experiment
    if (!hasKey(previousStatuses, id)) {
      continue
    }

    existingStatuses[id] = previousStatuses[id]
  }
  return existingStatuses
}

export const collectStatuses = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>,
  previousStatuses: Statuses
) => {
  const statuses = collectExistingStatuses(
    experiments,
    checkpointsByTip,
    previousStatuses
  )

  for (const experiment of experiments) {
    collectStatus(statuses, experiment, Status.SELECTED)

    for (const checkpoint of checkpointsByTip.get(experiment.id) || []) {
      collectStatus(statuses, checkpoint, Status.UNSELECTED)
    }
  }
  return statuses
}
