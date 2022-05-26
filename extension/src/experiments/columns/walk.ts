import {
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput,
  Value,
  ValueTree,
  ValueTreeRoot,
  OutsOrDepsDetails
} from '../../cli/reader'
import { ColumnType } from '../webview/contract'

export type OnValueCallback = (
  key: string,
  value: Value,
  meta: ValueWalkMeta,
  ancestors: string[]
) => void

export interface ValueWalkMeta {
  type: ColumnType
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
  type: ColumnType,
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

const walkOutsOrDepsDetails = (
  root: OutsOrDepsDetails,
  type: ColumnType,
  onValue: OnValueCallback
) => {
  for (const [file, value] of Object.entries(root)) {
    const meta = {
      file: ColumnType.DEPS,
      type
    }
    const paths = file.split('/')
    onValue(paths.slice(-1)[0], value.hash, meta, paths.slice(0, -1))
  }
}

const walkExperiment = (
  experiment: ExperimentFieldsOrError,
  onValue: OnValueCallback
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  const { data } = experiment
  if (data) {
    const { params, metrics, deps } = data
    if (metrics) {
      walkValueFileRoot(metrics, ColumnType.METRICS, onValue)
    }
    if (params) {
      walkValueFileRoot(params, ColumnType.PARAMS, onValue)
    }
    if (deps) {
      walkOutsOrDepsDetails(deps, ColumnType.DEPS, onValue)
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
