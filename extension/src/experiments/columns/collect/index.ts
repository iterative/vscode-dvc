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
} from '../../../cli/dvc/contract'
import { standardizePath } from '../../../fileSystem/path'
import { timestampColumn } from '../constants'

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

  acc.timestamp = timestampColumn

  const { workspace, ...rest } = data
  collectFromBranch(acc, workspace)
  for (const branch of Object.values(rest)) {
    collectFromBranch(acc, branch)
  }
  return Object.values(acc)
}

const getData = (value?: {
  baseline?: ExperimentFieldsOrError
}): ExperimentFields | undefined => value?.baseline?.data

export const collectChanges = (data: ExperimentsOutput): string[] => {
  const changes: string[] = []

  const [workspaceData, currentCommitData] = Object.values(data)
  const workspace = getData(workspaceData)
  const currentCommit = getData(currentCommitData)

  if (!(workspace && currentCommit)) {
    return changes
  }

  collectMetricAndParamChanges(changes, workspace, currentCommit)
  collectDepChanges(changes, workspace, currentCommit)

  return changes.sort()
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
