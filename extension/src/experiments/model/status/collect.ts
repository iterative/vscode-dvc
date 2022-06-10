import { canSelect, ColoredStatus, UNSELECTED } from '.'
import { Color, copyOriginalColors } from './colors'
import { hasKey } from '../../../util/object'
import { Experiment } from '../../webview/contract'
import { definedAndNonEmpty, reorderListSubset } from '../../../util/array'
import { flattenMapValues } from '../../../util/map'

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
  const { id, queued, error } = experiment
  if (!id || queued || error || hasKey(acc, id)) {
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
