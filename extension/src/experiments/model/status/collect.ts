import { canSelect, ColoredStatus, UNSELECTED } from '.'
import { Color, copyOriginalColors } from './colors'
import { hasKey } from '../../../util/object'
import { Experiment, isQueued, RunningExperiment } from '../../webview/contract'
import { definedAndNonEmpty, reorderListSubset } from '../../../util/array'
import { flattenMapValues } from '../../../util/map'
import { Executor, EXPERIMENT_WORKSPACE_ID } from '../../../cli/dvc/contract'

const canAssign = (
  coloredStatus: ColoredStatus,
  unassignedColors: Color[]
): boolean => canSelect(coloredStatus) && definedAndNonEmpty(unassignedColors)

const collectStatus = (acc: ColoredStatus, experiment: Experiment): void => {
  const { id, status } = experiment
  if (!id || isQueued(status) || hasKey(acc, id)) {
    return
  }

  acc[id] = UNSELECTED
}

const collectExistingStatuses = (
  experiments: Experiment[],
  experimentsByCommit: Map<string, Experiment[]>,
  previousStatus: ColoredStatus
): ColoredStatus => {
  const existingStatuses: ColoredStatus = {}
  for (const experiment of [
    ...experiments,
    ...flattenMapValues(experimentsByCommit)
  ]) {
    const { id } = experiment

    if (!hasKey(previousStatus, id)) {
      continue
    }

    existingStatuses[id] = previousStatus[id]
  }
  return existingStatuses
}

const collectStartedRunningColors = (
  coloredStatus: ColoredStatus,
  availableColors: Color[],
  unassignedColors: Color[],
  startedRunning: Set<string>
): void => {
  for (const id of startedRunning) {
    if (coloredStatus[id]) {
      continue
    }

    if (canAssign(coloredStatus, unassignedColors)) {
      coloredStatus[id] = availableColors.shift() as Color
    }
  }
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
  experimentsByCommit: Map<string, Experiment[]>,
  previousStatus: ColoredStatus,
  unassignedColors: Color[],
  startedRunning: Set<string>
): { coloredStatus: ColoredStatus; availableColors: Color[] } => {
  const flatExperimentsByCommit = flattenMapValues(experimentsByCommit)
  const availableColors = unassignColors(
    [...experiments, ...flatExperimentsByCommit],
    previousStatus,
    unassignedColors
  )

  const coloredStatus = collectExistingStatuses(
    experiments,
    experimentsByCommit,
    previousStatus
  )

  collectStartedRunningColors(
    coloredStatus,
    availableColors,
    unassignedColors,
    startedRunning
  )

  for (const experiment of [...experiments, ...flatExperimentsByCommit]) {
    collectStatus(coloredStatus, experiment)
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

export const collectStartedRunningExperiments = (
  previouslyRunning: RunningExperiment[],
  nowRunning: RunningExperiment[]
): Set<string> => {
  const acc = new Set<string>()

  for (const { id: runningId, executor } of nowRunning) {
    if (
      runningId === EXPERIMENT_WORKSPACE_ID ||
      executor === Executor.DVC_TASK ||
      previouslyRunning.some(({ id }) => id === runningId)
    ) {
      continue
    }
    acc.add(runningId)
  }

  return acc
}
