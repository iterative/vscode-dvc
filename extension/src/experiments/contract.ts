export type Value = string | number | boolean | null

export interface ValueTreeRoot {
  [filename: string]: ValueTree
}

export interface ValueTreeNode {
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

export interface Experiment extends ExperimentFields {
  sha: string
  subRows?: Experiment[]
}

export interface ExperimentsWorkspace {
  baseline: ExperimentFields
}

export interface ExperimentsBranch {
  baseline: Experiment
  subRows?: Experiment[]
}

export interface ExperimentsRepo {
  workspace: ExperimentsBranch
  branches: ExperimentsBranch[]
}

export interface ExperimentsBranchJSONOutput {
  [sha: string]: ExperimentFields
  baseline: ExperimentFields
}

export interface ExperimentsRepoJSONOutput {
  [name: string]: ExperimentsBranchJSONOutput
  workspace: ExperimentsBranchJSONOutput
}
