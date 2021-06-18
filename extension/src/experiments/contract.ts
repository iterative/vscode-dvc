export type Value = string | number | boolean | null

export interface ValueTreeRoot {
  [filename: string]: ValueTree
}

export interface ValueTreeNode {
  [key: string]: Value | ValueTree
}

export type ValueTree = ValueTreeRoot | ValueTreeNode

export interface Experiment {
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
  baseline: Experiment
}

export interface ExperimentsBranchJSONOutput {
  [sha: string]: Experiment
}

export interface ExperimentsRepoJSONOutput {
  [name: string]: ExperimentsWorkspaceJSONOutput | ExperimentsBranchJSONOutput
  workspace: ExperimentsWorkspaceJSONOutput
}
