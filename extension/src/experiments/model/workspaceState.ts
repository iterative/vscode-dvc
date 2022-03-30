import { Memento } from 'vscode'
import {
  copyOriginalBranchColors,
  copyOriginalExperimentColors
} from './colors'
import { Colors } from './colors/collect'
import { FilterDefinition } from './filterBy'
import { SortDefinition } from './sortBy'
import { Statuses } from './status'
import { MementoPrefix } from '../../vscode/memento'

const reviveColors = (
  workspaceState: Memento,
  key: string,
  copyOriginalColors: () => string[]
) => {
  const { assigned, available } = workspaceState.get<{
    assigned: [string, string][]
    available: string[]
  }>(key, {
    assigned: [],
    available: copyOriginalColors()
  })

  return {
    assigned: new Map(assigned),
    available: available
  }
}

export const revive = (
  dvcRoot: string,
  workspaceState: Memento
): {
  branchColors: Colors
  experimentColors: Colors
  currentSorts: SortDefinition[]
  filters: Map<string, FilterDefinition>
  status: Statuses
} => ({
  branchColors: reviveColors(
    workspaceState,
    MementoPrefix.BRANCH_COLORS + dvcRoot,
    copyOriginalBranchColors
  ),
  currentSorts: workspaceState.get<SortDefinition[]>(
    MementoPrefix.EXPERIMENTS_SORT_BY + dvcRoot,
    []
  ),
  experimentColors: reviveColors(
    workspaceState,
    MementoPrefix.EXPERIMENTS_COLORS + dvcRoot,
    copyOriginalExperimentColors
  ),
  filters: new Map(
    workspaceState.get<[string, FilterDefinition][]>(
      MementoPrefix.EXPERIMENTS_FILTER_BY + dvcRoot,
      []
    )
  ),
  status: workspaceState.get<Statuses>(
    MementoPrefix.EXPERIMENTS_STATUS + dvcRoot,
    {}
  )
})
