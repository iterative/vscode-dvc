import { sep } from 'path'
import { METRIC_PARAM_SEPARATOR } from './paths'
import {
  Deps,
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput,
  Value,
  ValueTree,
  ValueTreeRoot
} from '../../cli/reader'
import { ColumnType } from '../webview/contract'

export type OnValueCallback = (
  key: string,
  value: Value,
  type: ColumnType,
  ancestors: string[],
  sep: string
) => void

const walkValueTree = (
  tree: ValueTree,
  type: ColumnType,
  onValue: OnValueCallback,
  ancestors: string[] = []
) => {
  for (const [key, value] of Object.entries(tree)) {
    if (value && !Array.isArray(value) && typeof value === 'object') {
      walkValueTree(value, type, onValue, [...ancestors, key])
    } else {
      onValue(key, value, type, ancestors, METRIC_PARAM_SEPARATOR)
    }
  }
}

const walkValueFileRoot = (
  root: ValueTreeRoot,
  type: ColumnType,
  onValue: OnValueCallback
) => {
  for (const [file, value] of Object.entries(root)) {
    const { data } = value
    if (data) {
      walkValueTree(data, type, onValue, [file])
    }
  }
}

// for deps we want to nest the file inside of the directory
// instead of trying to jam everything in to the existing flow, break up the function and reuse parts of it
// can still use set on the rows side (probably)

const doDep = (deps: Deps, onValue: OnValueCallback) => {
  for (const [file, { hash }] of Object.entries(deps)) {
    const pathArray = file.split(sep)
    const key = pathArray.pop() as string
    onValue(key, hash, ColumnType.DEPS, pathArray, sep)
  }
}

const walkExperiment = (
  experiment: ExperimentFieldsOrError,
  onValue: OnValueCallback
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  const { data } = experiment
  if (data) {
    const { deps, params, metrics } = data
    if (metrics) {
      walkValueFileRoot(metrics, ColumnType.METRICS, onValue)
    }
    if (params) {
      walkValueFileRoot(params, ColumnType.PARAMS, onValue)
    }
    if (deps) {
      doDep(deps, onValue)
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
