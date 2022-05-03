import omit from 'lodash.omit'
import { ExperimentsAccumulator } from './accumulator'
import { extractMetricsAndParams } from '../metricsAndParams/extract'
import { Experiment, MetricOrParamType } from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentFields,
  ExperimentsBranchOutput,
  ExperimentsOutput
} from '../../cli/reader'
import { addToMapArray } from '../../util/map'
import { uniqueValues } from '../../util/array'

type ExperimentsObject = { [sha: string]: ExperimentFieldsOrError }

export const getShortSha = (sha: string) => sha.slice(0, 7)

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
  sha?: string,
  displayNameOrParent?: string
): Experiment => {
  const experiment = {
    id,
    label,
    ...omit(experimentFields, Object.values(MetricOrParamType))
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
  experimentData: ExperimentFieldsOrError,
  experimentsObject: ExperimentsObject,
  branchSha: string
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
      branchSha
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

    const branch = transformExperimentData(name, experimentFields, name, sha)

    if (branch) {
      collectFromExperimentsObject(acc, experimentsObject, sha, branch.label)

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

const getDefaultMutableRevision = (hasCheckpoints: boolean): string[] => {
  if (hasCheckpoints) {
    return []
  }
  return ['workspace']
}

const noWorkspaceVsSelectedRaceCondition = (
  hasCheckpoints: boolean,
  running: boolean | undefined,
  selected: boolean | undefined
): boolean => !!(hasCheckpoints && running && !selected)

const collectMutableRevision = (
  acc: string[],
  { label, running, selected }: Experiment,
  hasCheckpoints: boolean
) => {
  if (noWorkspaceVsSelectedRaceCondition(hasCheckpoints, running, selected)) {
    acc.push('workspace')
  }
  if (running && !hasCheckpoints) {
    acc.push(label)
  }
}

export const collectMutableRevisions = (
  experiments: Experiment[],
  hasCheckpoints: boolean
): string[] => {
  const acc = getDefaultMutableRevision(hasCheckpoints)

  for (const experiment of experiments) {
    collectMutableRevision(acc, experiment, hasCheckpoints)
  }

  return uniqueValues(acc)
}
