import { FilterDefinition, filterExperiment } from '.'
import { Experiment } from '../../webview/contract'

export const collectFiltered = (
  acc: Experiment[],
  filters: FilterDefinition[],
  experiment: Experiment
): Experiment[] => {
  if (!filterExperiment(filters, experiment)) {
    acc.push(experiment)
  }
  return acc
}
