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

type ScaleType = typeof WorkspaceScale[keyof typeof WorkspaceScale]

export type WorkspaceScale = Record<ScaleType, number>

const aggregateRepositoriesScale = async (
  acc: WorkspaceScale,
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
    for (const [type, value] of Object.entries(counts) as [
      ScaleType,
      number
    ][]) {
      acc[type] = acc[type] + value
    }
  }
}

export const collectWorkspaceScale = async (
  dvcRoots: string[],
  workspaceExperiments: WorkspaceExperiments,
  workspacePlots: WorkspacePlots,
  workspaceRepositories: WorkspaceRepositories
): Promise<WorkspaceScale> => {
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
