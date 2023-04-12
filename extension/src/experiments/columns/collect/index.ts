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
  ExpRange,
  ExpShowOutput,
  ExpState,
  ExpStateData,
  ExperimentFields,
  ExperimentFieldsOrError,
  ExperimentsCommitOutput,
  ExperimentsOutput
} from '../../../cli/dvc/contract'
import { standardizePath } from '../../../fileSystem/path'
import { timestampColumn } from '../constants'
import { sortCollectedArray } from '../../../util/array'
import { hasError, isCheckpoint } from '../../model/collect'

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
  for (const [sha, experiment] of Object.entries(rest)) {
    if (isCheckpoint(experiment.data?.checkpoint_tip, sha)) {
      continue
    }
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

const collectFromExperiments = (
  acc: ColumnAccumulator,
  experiments?: ExpRange[] | null
) => {
  if (!experiments) {
    return
  }
  for (const { revs } of experiments) {
    collectFromExperiment(acc, revs[0])
  }
}

export const collectColumns_ = (output: ExpShowOutput): Column[] => {
  const acc: ColumnAccumulator = {}

  acc.timestamp = timestampColumn

  for (const expState of output) {
    if (hasError(expState)) {
      continue
    }

    collectFromExperiment(acc, expState)
    collectFromExperiments(acc, expState.experiments)
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

  return sortCollectedArray(changes)
}

export const getData_ = (expState: ExpState): ExpStateData | undefined => {
  if (hasError(expState)) {
    return
  }
  return expState.data
}

export const collectChanges_ = (output: ExpShowOutput): string[] => {
  const changes: string[] = []

  if (!(output.length > 1)) {
    return changes
  }

  const [workspaceData, currentCommitData] = output
  const workspace = getData_(workspaceData)
  const currentCommit = getData_(currentCommitData)

  if (!(workspace && currentCommit)) {
    return changes
  }

  collectMetricAndParamChanges(changes, workspace, currentCommit)
  collectDepChanges(changes, workspace, currentCommit)

  return sortCollectedArray(changes)
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

export const collectParamsFiles_ = (
  dvcRoot: string,
  output: ExpShowOutput
): Set<string> => {
  const [workspace] = output
  if (hasError(workspace)) {
    return new Set()
  }
  const files = Object.keys(workspace.data.params || {})
    .filter(Boolean)
    .map(file => standardizePath(join(dvcRoot, file)))
  return new Set(files)
}
