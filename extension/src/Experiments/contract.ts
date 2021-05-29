export type Value = string | number | boolean | null | undefined
export interface ValueTree {
  [key: string]: Value | ValueTree
}

export interface DataDictRoot {
  [filename: string]: ValueTree
}

export interface ExperimentJSONOutput {
  name?: string
  timestamp?: string | null
  queued?: boolean
  params?: DataDictRoot
  metrics?: DataDictRoot
  checkpoint_tip?: string
  checkpoint_parent?: string
}

export interface ExperimentsWorkspaceJSONOutput
  extends ExperimentsBranchJSONOutput {
  baseline: ExperimentJSONOutput
}

export interface ExperimentsBranchJSONOutput {
  [sha: string]: ExperimentJSONOutput
}

export interface ExperimentsRepoJSONOutput {
  workspace: ExperimentsWorkspaceJSONOutput
  [name: string]: ExperimentsWorkspaceJSONOutput | ExperimentsBranchJSONOutput
}
