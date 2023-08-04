import {
  canSelect,
  ColoredStatus,
  limitToMaxSelected,
  tooManySelected,
  UNSELECTED
} from '.'
import { Color, copyOriginalColors } from './colors'
import { hasKey } from '../../../util/object'
import { Experiment, isQueued, RunningExperiment } from '../../webview/contract'
import { definedAndNonEmpty, reorderListSubset } from '../../../util/array'
import { flattenMapValues } from '../../../util/map'
import { Executor } from '../../../cli/dvc/contract'

const canAssign = (
  coloredStatus: ColoredStatus,
  unassignedColors: Color[]
): boolean => canSelect(coloredStatus) && definedAndNonEmpty(unassignedColors)

const collectStatus = (acc: ColoredStatus, experiment: Experiment): void => {
  const { id, executorStatus: status } = experiment
  if (!id || isQueued(status) || hasKey(acc, id)) {
    return
  }

  acc[id] = UNSELECTED
}

const collectExistingStatuses = (
  workspaceAndCommits: Experiment[],
  experimentsByCommit: Map<string, Experiment[]>,
  previousStatus: ColoredStatus
): ColoredStatus => {
  const existingStatuses: ColoredStatus = {}
  for (const experiment of [
    ...workspaceAndCommits,
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
  startedRunning: Set<string>
): void => {
  for (const id of startedRunning) {
    if (coloredStatus[id]) {
      continue
    }

    if (canAssign(coloredStatus, availableColors)) {
      coloredStatus[id] = availableColors.shift() as Color
    }
  }
}

const unassignColors = (
  experiments: Experiment[],
  current: ColoredStatus,
  unassigned: Color[]
): Color[] => {
  if (!definedAndNonEmpty(experiments)) {
    return copyOriginalColors()
  }

  const acc = new Set(unassigned)

  const experimentIds = new Set(experiments.map(({ id }) => id))
  for (const [id, color] of Object.entries(current)) {
    if (color && !experimentIds.has(id)) {
      acc.add(color)
    }
  }

  return reorderListSubset([...acc], copyOriginalColors())
}

export const collectColoredStatus = (
  workspaceAndCommits: Experiment[],
  experimentsByCommit: Map<string, Experiment[]>,
  previousStatus: ColoredStatus,
  unassignedColors: Color[],
  startedRunning: Set<string>
): { coloredStatus: ColoredStatus; availableColors: Color[] } => {
  const flatExperimentsByCommit = flattenMapValues(experimentsByCommit)
  let availableColors = unassignColors(
    [...workspaceAndCommits, ...flatExperimentsByCommit],
    previousStatus,
    unassignedColors
  )

  const coloredStatus = collectExistingStatuses(
    workspaceAndCommits,
    experimentsByCommit,
    previousStatus
  )

  const selectedColors = new Set(Object.values(coloredStatus).filter(Boolean))
  availableColors = availableColors.filter(
    availableColor => !selectedColors.has(availableColor)
  )

  collectStartedRunningColors(coloredStatus, availableColors, startedRunning)

  for (const experiment of [
    ...workspaceAndCommits,
    ...flatExperimentsByCommit
  ]) {
    collectStatus(coloredStatus, experiment)
  }

  return {
    availableColors,
    coloredStatus
  }
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

const cannotSelect = (
  ids: Set<string>,
  { id, executorStatus: status }: Experiment
): boolean => isQueued(status) || ids.has(id)

export const collectSelectable = (
  selectedExperiments: Experiment[]
): Experiment[] => {
  const acc: Experiment[] = []
  const collectedIds = new Set<string>()

  for (const experiment of selectedExperiments) {
    if (cannotSelect(collectedIds, experiment)) {
      continue
    }

    acc.push(experiment)
    collectedIds.add(experiment.id)
  }

  return tooManySelected(acc) ? limitToMaxSelected(acc) : acc
}

export const collectSelectedColors = (
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
      executor === Executor.DVC_TASK ||
      previouslyRunning.some(({ id }) => id === runningId)
    ) {
      continue
    }
    acc.add(runningId)
  }

  return acc
}
