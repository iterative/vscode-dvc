import { ExperimentsRepoJSONOutput } from '../cli/reader'

export const collectFiles = (data: ExperimentsRepoJSONOutput): string[] => {
  const { workspace } = data
  const workspaceBaseline = workspace.baseline?.data

  const files = new Set<string>()

  if (workspaceBaseline) {
    const { params, metrics } = workspaceBaseline

    if (params) {
      Object.keys(params).forEach(file => files.add(file))
    }
    if (metrics) {
      Object.keys(metrics).forEach(file => files.add(file))
    }
  }
  return [...files]
}
