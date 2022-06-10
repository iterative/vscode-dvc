import {
  FilterDefinition,
  filterExperiment,
  splitExperimentsByFilters
} from '.'
import { ExperimentType } from '..'
import { definedAndNonEmpty } from '../../../util/array'
import { Experiment } from '../../webview/contract'

export type ExperimentWithType = Experiment & { type: ExperimentType }

export const collectFilteredCounts = (
  experiments: { type: ExperimentType }[]
) => {
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
