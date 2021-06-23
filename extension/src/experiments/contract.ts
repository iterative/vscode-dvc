export type Value = string | number | boolean | null

export interface ValueTreeRoot {
  [filename: string]: ValueTree
}

export interface ValueTreeNode {
  [key: string]: Value | ValueTree
}

export type ValueTree = ValueTreeRoot | ValueTreeNode

interface ExperimentCommon {
  name?: string
  timestamp?: string | null
  queued?: boolean
  params?: ValueTreeRoot
  metrics?: ValueTreeRoot
  checkpoint_tip?: string
  checkpoint_parent?: string
}

type ExperimentJSONOutput = ExperimentCommon

export interface Experiment {
  sha?: string
  name?: string
  timestamp?: string | null
  queued?: boolean
  params?: ValueTreeRoot
  metrics?: ValueTreeRoot
  checkpoint_tip?: string
  checkpoint_parent?: string
  checkpoints?: Experiment[]
}

export interface ExperimentsWorkspace {
  baseline: Experiment
}

export interface ExperimentsBranch {
  name: string
  baseline: Experiment
  experiments?: Experiment[]
}

export interface ExperimentsRepo {
  workspace: ExperimentsBranch
  branches: ExperimentsBranch[]
}

export interface ExperimentsBranchJSONOutput {
  [sha: string]: ExperimentJSONOutput
  baseline: ExperimentJSONOutput
}

export interface ExperimentsRepoJSONOutput {
  [name: string]: ExperimentsBranchJSONOutput
  workspace: ExperimentsBranchJSONOutput
}
