export type Value = string | number | boolean | null

interface ValueTreeRoot {
  [filename: string]: ValueTree
}

interface ValueTreeNode {
  [key: string]: Value | ValueTree
}

export type ValueTree = ValueTreeRoot | ValueTreeNode

export interface ExperimentFields {
  name?: string
  timestamp?: string | null
  queued?: boolean
  params?: ValueTreeRoot
  metrics?: ValueTreeRoot
  checkpoint_tip?: string
  checkpoint_parent?: string
}

export interface ExperimentsBranchJSONOutput {
  [sha: string]: ExperimentFields
  baseline: ExperimentFields
}

export interface ExperimentsRepoJSONOutput {
  [name: string]: ExperimentsBranchJSONOutput
  workspace: { baseline: ExperimentFields }
}
