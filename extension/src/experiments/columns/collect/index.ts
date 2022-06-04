import { join } from 'path'
import get from 'lodash/get'
import { ColumnAccumulator } from './util'
import { collectDeps } from './deps'
import { collectMetricsAndParams } from './metricsAndParams'
import { joinColumnPath } from '../paths'
import { Column, ColumnType } from '../../webview/contract'
import {
  ExperimentFields,
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput,
  Value,
  ValueTree,
  ValueTreeOrError
} from '../../../cli/reader'
import { standardizePath } from '../../../fileSystem/path'

const collectFromExperiment = (
  acc: ColumnAccumulator,
  experiment: ExperimentFieldsOrError
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  const { data } = experiment
  if (data) {
    collectMetricsAndParams(acc, data)
    collectDeps(acc, data)
  }
}

const collectFromBranch = (
  acc: ColumnAccumulator,
  branch: ExperimentsBranchOutput
) => {
  const { baseline, ...rest } = branch
  collectFromExperiment(acc, baseline)
  for (const experiment of Object.values(rest)) {
    collectFromExperiment(acc, experiment)
  }
}

export const collectColumns = (data: ExperimentsOutput): Column[] => {
  const acc: ColumnAccumulator = {}

  const { workspace, ...rest } = data
  collectFromBranch(acc, workspace)
  for (const branch of Object.values(rest)) {
    collectFromBranch(acc, branch)
  }
  return Object.values(acc)
}

const collectChange = (
  changes: string[],
  type: ColumnType,
  file: string,
  key: string,
  value: Value | ValueTree,
  commitData: ExperimentFields,
  ancestors: string[] = []
) => {
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value as ValueTree)) {
      collectChange(changes, type, file, childKey, childValue, commitData, [
        ...ancestors,
        key
      ])
    }
    return
  }

  if (get(commitData?.[type], [file, 'data', ...ancestors, key]) !== value) {
    changes.push(joinColumnPath(type, file, ...ancestors, key))
  }

  // needs deps
}

const collectFileChanges = (
  changes: string[],
  type: ColumnType,
  commitData: ExperimentFields,
  file: string,
  value: ValueTreeOrError
) => {
  const data = value.data
  if (!data) {
    return
  }

  for (const [key, value] of Object.entries(data)) {
    collectChange(changes, type, file, key, value, commitData)
  }
}

const collectColumnsChanges = (
  changes: string[],
  workspaceData: ExperimentFields,
  commitData: ExperimentFields
) => {
  for (const type of Object.values(ColumnType)) {
    for (const [file, value] of Object.entries(workspaceData?.[type] || {})) {
      collectFileChanges(changes, type, commitData, file, value)
    }
  }
}

export const collectParamsFiles = (
  dvcRoot: string,
  data: ExperimentsOutput
): Set<string> => {
  const files = Object.keys(data.workspace.baseline.data?.params || {})
    .filter(Boolean)
    .map(file => standardizePath(join(dvcRoot, file))) as string[]
  return new Set(files)
}

const getData = (value: { baseline: ExperimentFieldsOrError }) =>
  value.baseline.data || {}

export const collectChanges = (data: ExperimentsOutput): string[] => {
  const changes: string[] = []

  let workspace
  let currentCommit

  for (const [key, value] of Object.entries(data)) {
    if (key === 'workspace') {
      workspace = getData(value)
      continue
    }
    currentCommit = getData(value)
  }

  if (!(workspace && currentCommit)) {
    return changes
  }

  collectColumnsChanges(changes, workspace, currentCommit)

  return changes.sort()
}
