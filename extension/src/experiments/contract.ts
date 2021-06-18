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
  sha?: string
}

export interface CheckpointTip extends Experiment {
  checkpoints?: Experiment[]
}

export interface ExperimentsWorkspace {
  baseline: Experiment
}

export interface Branch {
  baseline: Experiment
  experiments: CheckpointTip[]
}

export interface ExperimentsBranchJSONOutput {
  [sha: string]: Experiment
  baseline: Experiment
}

export interface ExperimentsRepoJSONOutput {
  [name: string]: ExperimentsBranchJSONOutput
  workspace: ExperimentsBranchJSONOutput
}
