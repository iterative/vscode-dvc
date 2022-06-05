import { join } from 'path'
import { ColumnAccumulator } from './util'
import { collectDepChanges, collectDeps } from './deps'
import {
  collectMetricAndParamChanges,
  collectMetricsAndParams
} from './metricsAndParams'
import { Column } from '../../webview/contract'
import {
  ExperimentFields,
  ExperimentFieldsOrError,
  ExperimentsBranchOutput,
  ExperimentsOutput
} from '../../../cli/reader'
import { standardizePath } from '../../../fileSystem/path'

const collectFromExperiment = (
  acc: ColumnAccumulator,
  experiment: ExperimentFieldsOrError
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

const collectColumnsChanges = (
  changes: string[],
  workspaceData: ExperimentFields,
  commitData: ExperimentFields
) => {
  collectMetricAndParamChanges(changes, workspaceData, commitData)
  collectDepChanges(changes, workspaceData, commitData)
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
