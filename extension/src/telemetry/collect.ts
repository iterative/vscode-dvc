import { ExperimentsCounts } from '../experiments'
import { WorkspaceExperiments } from '../experiments/workspace'
import { PlotsCounts } from '../plots'
import { WorkspacePlots } from '../plots/workspace'
import { RepositoryCounts } from '../repository'
import { WorkspaceRepositories } from '../repository/workspace'

const Counts = Object.assign(ExperimentsCounts, PlotsCounts, RepositoryCounts)
type Counts = typeof Counts[keyof typeof Counts]

export type WorkspaceCountAccumulator = Record<Counts, number>

export const collectCounts = async (
  dvcRoots: string[],
  workspaceExperiments: WorkspaceExperiments,
  workspacePlots: WorkspacePlots,
  workspaceRepositories: WorkspaceRepositories
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<WorkspaceCountAccumulator> => {
  const acc = {} as WorkspaceCountAccumulator
  for (const count of Object.values(Counts)) {
    acc[count] = 0
  }

  for (const workspace of [
    workspaceExperiments,
    workspacePlots,
    workspaceRepositories
  ]) {
    await workspace.isReady()

    for (const dvcRoot of dvcRoots) {
      const repository = workspace.getRepository(dvcRoot)
      if (!repository) {
        continue
      }
      const counts = repository.getCounts()
      for (const [key, value] of Object.entries(counts) as [Counts, number][]) {
        acc[key] = acc[key] + value
      }
    }
  }

  return acc
}
