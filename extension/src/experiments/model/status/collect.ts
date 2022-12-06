import { canSelect, ColoredStatus, UNSELECTED } from '.'
import { Color, copyOriginalColors } from './colors'
import { hasKey } from '../../../util/object'
import { Experiment, isQueued, isRunning } from '../../webview/contract'
import { definedAndNonEmpty, reorderListSubset } from '../../../util/array'
import { flattenMapValues } from '../../../util/map'

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
  checkpointsByTip: Map<string, Experiment[]>,
  experimentsByBranch: Map<string, Experiment[]>,
  previousStatus: ColoredStatus
): ColoredStatus => {
  const existingStatuses: ColoredStatus = {}
  for (const experiment of [
    ...experiments,
    ...flattenMapValues(experimentsByBranch),
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

const removeRunningCheckpointExperiment = (
  coloredStatus: ColoredStatus,
  { status, executor, id }: Experiment
): void => {
  if (
    isRunning(status) &&
    executor === 'workspace' &&
    id !== 'workspace' &&
    !coloredStatus[id]
  ) {
    delete coloredStatus[id]
  }
}

const reassignFinishedWorkspaceExperiment = (
  coloredStatus: ColoredStatus,
  finishedRunning: { [id: string]: string }
): void => {
  for (const [id, previousId] of Object.entries(finishedRunning)) {
    if (previousId === 'workspace' && coloredStatus.workspace) {
      coloredStatus[id] = coloredStatus.workspace
      coloredStatus.workspace = UNSELECTED
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
  checkpointsByTip: Map<string, Experiment[]>,
  experimentsByBranch: Map<string, Experiment[]>,
  previousStatus: ColoredStatus,
  unassignedColors: Color[],
  startedRunning: Set<string>,
  finishedRunning: { [id: string]: string }
): { coloredStatus: ColoredStatus; availableColors: Color[] } => {
  const flattenExperimentsByBranch = flattenMapValues(experimentsByBranch)
  const flattenCheckpoints = flattenMapValues(checkpointsByTip)
  const availableColors = unassignColors(
    [...experiments, ...flattenExperimentsByBranch, ...flattenCheckpoints],
    previousStatus,
    unassignedColors
  )

  const coloredStatus = collectExistingStatuses(
    experiments,
    checkpointsByTip,
    experimentsByBranch,
    previousStatus
  )

  collectStartedRunningColors(
    coloredStatus,
    availableColors,
    unassignedColors,
    startedRunning
  )

  for (const experiment of [
    ...experiments,
    ...flattenExperimentsByBranch,
    ...flattenCheckpoints
  ]) {
    collectStatus(coloredStatus, experiment)
    removeRunningCheckpointExperiment(coloredStatus, experiment)
  }

  reassignFinishedWorkspaceExperiment(coloredStatus, finishedRunning)

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

const getMostRecentExperiment = (
  experiments: Experiment[],
  coloredStatus: ColoredStatus
): Experiment | undefined =>
  experiments
    .filter(({ id }) => coloredStatus[id] === undefined)
    .sort(({ Created: aCreated }, { Created: bCreated }) => {
      if (!aCreated) {
        return 1
      }
      if (!bCreated) {
        return -1
      }
      return bCreated.localeCompare(aCreated)
    })
    .slice(0, 1)[0]

const collectFinishedWorkspaceExperiment = (
  acc: { [id: string]: string },
  mostRecentExperiment: Experiment | undefined
): void => {
  const newId = mostRecentExperiment?.id

  if (!newId) {
    return
  }

  for (const [id, previousId] of Object.entries(acc)) {
    if (previousId === 'workspace') {
      delete acc[id]
    }
  }
  acc[newId] = 'workspace'
}

export const collectStartedRunningExperiments = (
  previouslyRunning: { id: string; executor: string }[],
  nowRunning: { id: string; executor: string }[]
): Set<string> => {
  const acc = new Set<string>()

  for (const { id: runningId, executor } of nowRunning) {
    if (previouslyRunning.some(({ id }) => id === runningId)) {
      continue
    }
    acc.add(executor === 'workspace' ? 'workspace' : runningId)
  }

  return acc
}

const isStillRunning = (
  stillExecutingInWorkspace: boolean,
  previouslyRunningId: string,
  previouslyRunningExecutor: string,
  stillRunning: { id: string; executor: string }[]
): boolean =>
  (stillExecutingInWorkspace && previouslyRunningExecutor === 'workspace') ||
  stillRunning.some(({ id }) => id === previouslyRunningId)

export const collectFinishedRunningExperiments = (
  acc: { [id: string]: string },
  experiments: Experiment[],
  previouslyRunning: { id: string; executor: string }[],
  stillRunning: { id: string; executor: string }[],
  coloredStatus: ColoredStatus
): { [id: string]: string } => {
  const stillExecutingInWorkspace = stillRunning.some(
    ({ executor }) => executor === 'workspace'
  )
  for (const {
    id: previouslyRunningId,
    executor: previouslyRunningExecutor
  } of previouslyRunning) {
    if (
      isStillRunning(
        stillExecutingInWorkspace,
        previouslyRunningId,
        previouslyRunningExecutor,
        stillRunning
      )
    ) {
      continue
    }

    if (previouslyRunningExecutor === 'workspace') {
      collectFinishedWorkspaceExperiment(
        acc,
        getMostRecentExperiment(experiments, coloredStatus)
      )
      continue
    }
    acc[previouslyRunningId] = previouslyRunningId
  }
  return acc
}
