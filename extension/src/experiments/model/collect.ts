import omit from 'lodash.omit'
import { ExperimentsAccumulator } from './accumulator'
import { Color, copyOriginalColors } from './colors'
import { canSelect, ColoredStatus, UNSELECTED } from './status'
import { extractMetricsAndParams } from '../metricsAndParams/extract'
import { Experiment, MetricOrParamType } from '../webview/contract'
import {
  ExperimentFieldsOrError,
  ExperimentFields,
  ExperimentsBranchOutput,
  ExperimentsOutput
} from '../../cli/reader'
import { addToMapArray, flattenMapValues } from '../../util/map'
import { hasKey } from '../../util/object'
import { definedAndNonEmpty, reorderListSubset } from '../../util/array'

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
  hasCheckpoints: boolean,
  sha?: string,
  displayNameOrParent?: string
): Experiment => {
  const experiment = {
    id,
    label,
    ...omit(experimentFields, Object.values(MetricOrParamType)),
    mutable: !!(!hasCheckpoints && experimentFields.running)
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
  branchSha: string,
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
        hasCheckpoints
      )
    : undefined

  const acc = new ExperimentsAccumulator(workspaceBaseline, hasCheckpoints)

  collectFromBranchesObject(acc, branchesObject)
  return acc
}

const getStatus = (
  acc: ColoredStatus,
  unassignColors?: Color[]
): Color | typeof UNSELECTED => {
  if (canSelect(acc) && definedAndNonEmpty(unassignColors)) {
    return unassignColors.shift() as Color
  }

  return UNSELECTED
}

const collectStatus = (
  acc: ColoredStatus,
  experiment: Experiment,
  unassignColors?: Color[]
) => {
  const { id, queued } = experiment
  if (!id || queued || hasKey(acc, id)) {
    return
  }
  acc[id] = getStatus(acc, unassignColors)
}

const collectExistingStatuses = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>,
  previousStatus: ColoredStatus
) => {
  const existingStatuses: ColoredStatus = {}
  for (const experiment of [
    ...experiments,
    ...flattenMapValues(checkpointsByTip)
  ]) {
    const { id } = experiment
    if (!hasKey(previousStatus, id)) {
      continue
    }

    existingStatuses[id] = previousStatus[id]
  }
  return existingStatuses
}

export const unassignColors = (
  experiments: Experiment[],
  current: ColoredStatus,
  unassigned: Color[]
): Color[] => {
  if (!definedAndNonEmpty(experiments)) {
    return copyOriginalColors()
  }

  const experimentIds = new Set(experiments.map(({ id }) => id))
  for (const [id, color] of Object.entries(current)) {
    if (color && !experimentIds.has(id)) {
      unassigned.unshift(color)
    }
  }

  return reorderListSubset(unassigned, copyOriginalColors())
}

export const collectColoredStatus = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>,
  previousStatus: ColoredStatus,
  unassignedColors: Color[]
): { coloredStatus: ColoredStatus; availableColors: Color[] } => {
  const availableColors = unassignColors(
    [...experiments, ...flattenMapValues(checkpointsByTip)],
    previousStatus,
    unassignedColors
  )

  const coloredStatus = collectExistingStatuses(
    experiments,
    checkpointsByTip,
    previousStatus
  )

  for (const experiment of experiments) {
    collectStatus(coloredStatus, experiment, availableColors)

    for (const checkpoint of checkpointsByTip.get(experiment.id) || []) {
      collectStatus(coloredStatus, checkpoint)
    }
  }

  return { availableColors, coloredStatus }
}

const unassignUnselected = (
  selected: Set<string>,
  experiments: Experiment[],
  previousStatus: ColoredStatus,
  previousAvailableColors: Color[]
) => {
  const coloredStatus: ColoredStatus = {}
  const availableColors = [...previousAvailableColors]
  for (const { id } of experiments) {
    const current = previousStatus[id]
    if (selected.has(id)) {
      continue
    }

    if (current) {
      availableColors.unshift(current)
    }

    coloredStatus[id] = UNSELECTED
  }

  return {
    availableColors: reorderListSubset(availableColors, copyOriginalColors()),
    coloredStatus
  }
}

const assignSelected = (
  selectedExperiments: Experiment[],
  previousStatus: ColoredStatus,
  coloredStatus: ColoredStatus,
  availableColors: Color[]
) => {
  for (const { id } of selectedExperiments) {
    coloredStatus[id] = previousStatus[id] || (availableColors.shift() as Color)
  }

  return { availableColors, coloredStatus }
}

export const collectSelected = (
  selectedExperiments: Experiment[],
  experiments: Experiment[],
  previousStatus: ColoredStatus,
  previousAvailableColors: Color[]
) => {
  const selected = new Set(selectedExperiments.map(exp => exp.id))

  const { availableColors, coloredStatus } = unassignUnselected(
    selected,
    experiments,
    previousStatus,
    previousAvailableColors
  )

  return assignSelected(
    selectedExperiments,
    previousStatus,
    coloredStatus,
    availableColors
  )
}
