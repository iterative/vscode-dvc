import { FilterDefinition, filterExperiment } from '.'
import { definedAndNonEmpty } from '../../../util/array'
import { Commit, Experiment } from '../../webview/contract'

export const collectFiltered = (
  acc: Experiment[],
  commit: Commit,
  experiments: Experiment[] | undefined,
  filters: FilterDefinition[]
) => {
  let hasUnfilteredExperiment = false
  for (const experiment of experiments || []) {
    if (!filterExperiment(filters, experiment)) {
      acc.push(experiment)
      continue
    }
    hasUnfilteredExperiment = true
  }
  if (!hasUnfilteredExperiment && !filterExperiment(filters, commit)) {
    acc.push(commit)
  }
}

export const collectUnfiltered = (
  commit: Commit,
  experiments: Experiment[] | undefined,
  filters: FilterDefinition[]
): Commit | undefined => {
  const unfilteredExperiments = experiments?.filter(
    (experiment: Experiment) => !!filterExperiment(filters, experiment)
  )

  const hasUnfilteredExperiments = definedAndNonEmpty(unfilteredExperiments)
  const filtered =
    !hasUnfilteredExperiments && !filterExperiment(filters, commit)

  if (filtered) {
    return
  }

  if (hasUnfilteredExperiments) {
    commit.subRows = unfilteredExperiments
  }

  return commit
}
