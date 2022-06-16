import {
  FilterDefinition,
  filterExperiment,
  splitExperimentsByFilters
} from '.'
import { ExperimentType } from '..'
import { definedAndNonEmpty } from '../../../util/array'
import { Experiment } from '../../webview/contract'

export type ExperimentWithType = Experiment & { type: ExperimentType }
export type FilteredCounts = {
  checkpoints?: number
  experiments: number
}

const collectCountsWithCheckpoints = (
  experiments: { type: ExperimentType }[]
): FilteredCounts => {
  const filtered = { checkpoints: 0, experiments: 0 }

  for (const { type } of experiments) {
    if (type === ExperimentType.CHECKPOINT) {
      filtered.checkpoints = filtered.checkpoints + 1
    }
    if (type === ExperimentType.EXPERIMENT) {
      filtered.experiments = filtered.experiments + 1
    }
  }

  return filtered
}

export const collectFilteredCounts = (
  experiments: { type: ExperimentType }[],
  hasCheckpoints = true
): FilteredCounts => {
  if (!hasCheckpoints) {
    return { experiments: experiments.length }
  }

  return collectCountsWithCheckpoints(experiments)
}

const aggregateCounts = (
  acc: FilteredCounts,
  experimentCount: number,
  checkpointCount: number | undefined
) => {
  if (experimentCount) {
    acc.experiments = acc.experiments + experimentCount
  }
  if (checkpointCount !== undefined) {
    acc.checkpoints = (acc.checkpoints || 0) + checkpointCount
  }
}

export const collectCombinedFilteredCounts = (
  filteredCounts: FilteredCounts[]
): FilteredCounts => {
  const acc: FilteredCounts = { checkpoints: undefined, experiments: 0 }
  for (const { experiments, checkpoints } of filteredCounts) {
    aggregateCounts(acc, experiments, checkpoints)
  }
  return acc
}

export const collectFiltered = (
  acc: ExperimentWithType[],
  filters: FilterDefinition[],
  experiment: Experiment,
  checkpoints: ExperimentWithType[]
): ExperimentWithType[] => {
  const { filtered, unfiltered } = splitExperimentsByFilters(
    filters,
    checkpoints
  )
  acc.push(...filtered)
  const hasUnfilteredCheckpoints = definedAndNonEmpty(unfiltered)
  if (hasUnfilteredCheckpoints) {
    return acc
  }
  if (!filterExperiment(filters, experiment)) {
    acc.push({ ...experiment, type: ExperimentType.EXPERIMENT })
  }
  return acc
}
