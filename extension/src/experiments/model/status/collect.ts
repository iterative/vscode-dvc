import {
  canSelect,
  ColoredStatus,
  limitToMaxSelected,
  tooManySelected,
  UNSELECTED
} from '.'
import { Color, copyOriginalColors } from './colors'
import { hasKey } from '../../../util/object'
import {
  Experiment,
  isQueued,
  isRunning,
  isRunningInQueue,
  RunningExperiment
} from '../../webview/contract'
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

const removeUnselectedExperimentRunningInWorkspace = (
  coloredStatus: ColoredStatus,
  { status, executor, id }: Experiment
): void => {
  if (
    isRunning(status) &&
    executor === EXPERIMENT_WORKSPACE_ID &&
    id !== EXPERIMENT_WORKSPACE_ID &&
    !coloredStatus[id]
  ) {
    delete coloredStatus[id]
  }
}

const duplicateFinishedWorkspaceExperiment = (
  coloredStatus: ColoredStatus,
  finishedRunning: { [id: string]: string }
): void => {
  for (const [id, previousId] of Object.entries(finishedRunning)) {
    if (previousId !== EXPERIMENT_WORKSPACE_ID || coloredStatus[id]) {
      continue
    }

    coloredStatus[id] = coloredStatus.workspace
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
  startedRunning: Set<string>,
  finishedRunning: { [id: string]: string }
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
    removeUnselectedExperimentRunningInWorkspace(coloredStatus, experiment)
  }

  duplicateFinishedWorkspaceExperiment(coloredStatus, finishedRunning)

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
  { executor, id, status }: Experiment
): boolean =>
  isQueued(status) || isRunningInQueue({ executor, status }) || ids.has(id)

const shouldSelectWorkspace = ({ executor, status }: Experiment): boolean =>
  executor === Executor.WORKSPACE && isRunning(status)

const collectWorkspace = (
  acc: Experiment[],
  collectedIds: Set<string>,
  workspace: Experiment
) => {
  if (!collectedIds.has(EXPERIMENT_WORKSPACE_ID)) {
    acc.push(workspace)
  }
  collectedIds.add(EXPERIMENT_WORKSPACE_ID)
}

export const collectSelectable = (
  selectedExperiments: Experiment[],
  workspace: Experiment
): Experiment[] => {
  const acc: Experiment[] = []
  const collectedIds = new Set<string>()

  for (const experiment of selectedExperiments) {
    if (cannotSelect(collectedIds, experiment)) {
      continue
    }

    if (shouldSelectWorkspace(experiment)) {
      collectWorkspace(acc, collectedIds, workspace)
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
    acc.add(
      executor === EXPERIMENT_WORKSPACE_ID ? EXPERIMENT_WORKSPACE_ID : runningId
    )
  }

  return acc
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
    if (previousId === EXPERIMENT_WORKSPACE_ID) {
      delete acc[id]
    }
  }
  acc[newId] = EXPERIMENT_WORKSPACE_ID
}

const isStillRunning = (
  stillExecutingInWorkspace: boolean,
  previouslyRunningId: string,
  previouslyRunningExecutor: string,
  stillRunning: RunningExperiment[]
): boolean =>
  (stillExecutingInWorkspace &&
    previouslyRunningExecutor === EXPERIMENT_WORKSPACE_ID) ||
  stillRunning.some(({ id }) => id === previouslyRunningId)

export const collectFinishedRunningExperiments = (
  acc: { [id: string]: string },
  experiments: Experiment[],
  previouslyRunning: RunningExperiment[],
  stillRunning: RunningExperiment[],
  coloredStatus: ColoredStatus
): { [id: string]: string } => {
  const stillExecutingInWorkspace = stillRunning.some(
    ({ executor }) => executor === EXPERIMENT_WORKSPACE_ID
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

    if (previouslyRunningExecutor === EXPERIMENT_WORKSPACE_ID) {
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

export type FetchedExperiment = { id?: string; displayColor: Color }

export const hasFinishedWorkspaceExperiment = (
  fetchedExperiments: FetchedExperiment[]
): boolean => {
  let workspace: FetchedExperiment | undefined
  const nonWorkspace: FetchedExperiment[] = []

  for (const revision of fetchedExperiments) {
    if (revision.id === EXPERIMENT_WORKSPACE_ID) {
      workspace = revision
      continue
    }
    nonWorkspace.push(revision)
  }

  if (!workspace) {
    return false
  }

  return nonWorkspace.some(
    ({ displayColor }) => displayColor === workspace?.displayColor
  )
}
