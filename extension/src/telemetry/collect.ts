import { ExperimentsScale } from '../experiments'
import { WorkspaceExperiments } from '../experiments/workspace'
import { PlotsScale } from '../plots/paths/collect'
import { WorkspacePlots } from '../plots/workspace'
import { RepositoryScale } from '../repository'
import { WorkspaceRepositories } from '../repository/workspace'
import { createTypedAccumulator } from '../util/object'

const WorkspaceScale = Object.assign(
  ExperimentsScale,
  PlotsScale,
  RepositoryScale
)
type WorkspaceScale = typeof WorkspaceScale[keyof typeof WorkspaceScale]
type WorkspaceScaleAccumulator = Record<WorkspaceScale, number>

const aggregateRepositoriesScale = async (
  acc: WorkspaceScaleAccumulator,
  dvcRoots: string[],
  workspace: WorkspaceExperiments | WorkspacePlots | WorkspaceRepositories
) => {
  await workspace.isReady()

  for (const dvcRoot of dvcRoots) {
    const repository = workspace.getRepository(dvcRoot)
    if (!repository) {
      continue
    }
    const counts = repository.getScale()
    for (const [key, value] of Object.entries(counts) as [
      WorkspaceScale,
      number
    ][]) {
      acc[key] = acc[key] + value
    }
  }
}

export const collectWorkspaceScale = async (
  dvcRoots: string[],
  workspaceExperiments: WorkspaceExperiments,
  workspacePlots: WorkspacePlots,
  workspaceRepositories: WorkspaceRepositories
): Promise<WorkspaceScaleAccumulator> => {
  const acc = createTypedAccumulator(WorkspaceScale)

  for (const workspace of [
    workspaceExperiments,
    workspacePlots,
    workspaceRepositories
  ]) {
    await aggregateRepositoriesScale(acc, dvcRoots, workspace)
  }

  return acc
}
