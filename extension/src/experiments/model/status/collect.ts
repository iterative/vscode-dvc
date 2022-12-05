import { canSelect, ColoredStatus, UNSELECTED } from '.'
import { Color, copyOriginalColors } from './colors'
import { hasKey } from '../../../util/object'
import { Experiment, isQueued, isRunning } from '../../webview/contract'
import { definedAndNonEmpty, reorderListSubset } from '../../../util/array'
import { flattenMapValues } from '../../../util/map'

const getStatus = (
  acc: ColoredStatus,
  { status, executor }: Experiment,
  unassignColors?: Color[]
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Color | typeof UNSELECTED => {
  // new experiment running outside of the workspace
  if (
    canSelect(acc) &&
    definedAndNonEmpty(unassignColors) &&
    isRunning(status) &&
    executor !== 'workspace'
  ) {
    return unassignColors.shift() as Color
  }

  // experiment running in workspace
  if (
    canSelect(acc) &&
    definedAndNonEmpty(unassignColors) &&
    isRunning(status) &&
    executor === 'workspace' &&
    acc.workspace === UNSELECTED
  ) {
    acc.workspace = unassignColors.shift() as Color
    return UNSELECTED
  }

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
  const { id, status } = experiment
  if (!id || isQueued(status) || (id !== 'workspace' && hasKey(acc, id))) {
    return
  }

  acc[id] = getStatus(acc, experiment, unassignColors)
}

const collectExistingStatuses = (
  experiments: Experiment[],
  checkpointsByTip: Map<string, Experiment[]>,
  experimentsByBranch: Map<string, Experiment[]>,
  previousStatus: ColoredStatus
) => {
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
  finishedRunning: { [id: string]: string }
  // eslint-disable-next-line sonarjs/cognitive-complexity
): { coloredStatus: ColoredStatus; availableColors: Color[] } => {
  const flattenExperimentsByBranch = flattenMapValues(experimentsByBranch)
  const availableColors = unassignColors(
    [
      ...experiments,
      ...flattenExperimentsByBranch,
      ...flattenMapValues(checkpointsByTip)
    ],
    previousStatus,
    unassignedColors
  )

  const coloredStatus = collectExistingStatuses(
    experiments,
    checkpointsByTip,
    experimentsByBranch,
    previousStatus
  )

  for (const experiment of [...experiments, ...flattenExperimentsByBranch]) {
    collectStatus(coloredStatus, experiment, availableColors)

    for (const checkpoint of checkpointsByTip.get(experiment.id) || []) {
      collectStatus(coloredStatus, checkpoint)
    }
  }

  for (const [id, previousId] of Object.entries(finishedRunning)) {
    if (previousId === 'workspace' && coloredStatus.workspace) {
      coloredStatus[id] = coloredStatus.workspace
      coloredStatus.workspace = UNSELECTED
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

// assumption breaks if experiment does not complete correctly: fix
// potentially can use experiment status but need to exclude experiments running in workspace from it
const getMostRecentExperiment = (
  experiments: Experiment[]
): Experiment | undefined =>
  experiments
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

export const collectFinishedRunningExperiments = (
  acc: { [id: string]: string },
  experiments: Experiment[],
  previouslyRunning: { id: string; executor: string }[],
  stillRunning: { id: string; executor: string }[]
  // eslint-disable-next-line sonarjs/cognitive-complexity
): { [id: string]: string } => {
  const stillExecutingInWorkspace = stillRunning.some(
    ({ executor }) => executor === 'workspace'
  )
  for (const {
    id: previouslyRunningId,
    executor: previouslyRunningExecutor
  } of previouslyRunning) {
    if (
      (stillExecutingInWorkspace &&
        previouslyRunningExecutor === 'workspace') ||
      stillRunning.some(({ id }) => id === previouslyRunningId)
    ) {
      continue
    }

    if (previouslyRunningExecutor === 'workspace') {
      collectFinishedWorkspaceExperiment(
        acc,
        getMostRecentExperiment(experiments)
      )
      continue
    }
    acc[previouslyRunningId] = previouslyRunningId
  }
  return acc
}
