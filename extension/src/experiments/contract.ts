export type Value = string | number | boolean | null

export interface ValueTreeRoot {
  [filename: string]: ValueTree
}

export interface ValueTreeNode {
  [key: string]: Value | ValueTree
}

export type ValueTree = ValueTreeRoot | ValueTreeNode

export interface ExperimentJSONOutput {
  name?: string
  timestamp?: string | null
  queued?: boolean
  params?: ValueTreeRoot
  metrics?: ValueTreeRoot
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
  [name: string]: ExperimentsWorkspaceJSONOutput | ExperimentsBranchJSONOutput
  workspace: ExperimentsWorkspaceJSONOutput
}
