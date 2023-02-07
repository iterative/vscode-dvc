import { join } from 'path'
import isEqual from 'lodash.isequal'
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
  ExperimentsCommitOutput,
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

const collectFromCommit = (
  acc: ColumnAccumulator,
  commit: ExperimentsCommitOutput
) => {
  const { baseline, ...rest } = commit
  collectFromExperiment(acc, baseline)
  for (const experiment of Object.values(rest)) {
    collectFromExperiment(acc, experiment)
  }
}

export const collectColumns = (data: ExperimentsOutput): Column[] => {
  const acc: ColumnAccumulator = {}

  acc.timestamp = timestampColumn

  const { workspace, ...rest } = data
  collectFromCommit(acc, workspace)
  for (const commit of Object.values(rest)) {
    collectFromCommit(acc, commit)
  }
  const columns = Object.values(acc)
  const hasNoData = isEqual(columns, [timestampColumn])

  return hasNoData ? [] : columns
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
    .map(file => standardizePath(join(dvcRoot, file)))
  return new Set(files)
}
