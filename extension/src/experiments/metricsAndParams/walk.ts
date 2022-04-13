import {
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput,
  Value,
  ValueTree,
  ValueTreeRoot
} from '../../cli/reader'
import { MetricOrParamType } from '../webview/contract'

export type OnValueCallback = (
  key: string,
  value: Value,
  meta: ValueWalkMeta,
  ancestors: string[]
) => void

export interface ValueWalkMeta {
  type: MetricOrParamType
  file: string
}

const walkValueTree = (
  tree: ValueTree,
  meta: ValueWalkMeta,
  onValue: OnValueCallback,
  ancestors: string[] = []
) => {
  for (const [key, value] of Object.entries(tree)) {
    if (value && typeof value === 'object') {
      walkValueTree(value, meta, onValue, [...ancestors, key])
    } else {
      onValue(key, value, meta, ancestors)
    }
  }
}

const walkValueFileRoot = (
  root: ValueTreeRoot,
  type: MetricOrParamType,
  onValue: OnValueCallback
) => {
  for (const [file, value] of Object.entries(root)) {
    const { data } = value
    if (data) {
      const meta = {
        file,
        type
      }
      walkValueTree(data, meta, onValue)
    }
  }
}

const walkExperiment = (
  experiment: ExperimentFieldsOrError,
  onValue: OnValueCallback
) => {
  const { data } = experiment
  if (data) {
    const { params, metrics } = data
    if (metrics) {
      walkValueFileRoot(metrics, MetricOrParamType.METRICS, onValue)
    }
    if (params) {
      walkValueFileRoot(params, MetricOrParamType.PARAMS, onValue)
    }
  }
}

const walkBranch = (
  branch: ExperimentsBranchOutput,
  onValue: OnValueCallback
) => {
  const { baseline, ...rest } = branch
  walkExperiment(baseline, onValue)
  for (const experiment of Object.values(rest)) {
    walkExperiment(experiment, onValue)
  }
}

export const walkRepo = (repo: ExperimentsOutput, onValue: OnValueCallback) => {
  const { workspace, ...rest } = repo
  walkBranch(workspace, onValue)
  for (const branch of Object.values(rest)) {
    walkBranch(branch, onValue)
  }
}
