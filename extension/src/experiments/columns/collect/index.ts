import { join } from 'path'
import isEqual from 'lodash.isequal'
import { ColumnAccumulator } from './util'
import { collectDepChanges, collectDeps } from './deps'
import {
  collectMetricAndParamChanges,
  collectMetricsAndParams
} from './metricsAndParams'
import { Column, ColumnType, Commit, Experiment } from '../../webview/contract'
import { getValue } from '../util'
import {
  ExpRange,
  ExpShowOutput,
  ExpState,
  ExpData,
  experimentHasError,
  EXPERIMENT_WORKSPACE_ID
} from '../../../cli/dvc/contract'
import { standardizePath } from '../../../fileSystem/path'
import { timestampColumn } from '../constants'
import { sortCollectedArray, uniqueValues } from '../../../util/array'
import { FilterDefinition, filterExperiment } from '../../model/filterBy'

const collectFromExperiment = (
  acc: ColumnAccumulator,
  experiment: ExpState
) => {
  if (experimentHasError(experiment)) {
    return
  }

  const { data } = experiment
  if (data) {
    return Promise.all([
      collectMetricsAndParams(acc, data),
      collectDeps(acc, data)
    ])
  }
}

const collectFromExperiments = async (
  acc: ColumnAccumulator,
  experiments?: ExpRange[] | null
) => {
  if (!experiments) {
    return
  }

  const promises = []
  for (const { revs } of experiments) {
    promises.push(collectFromExperiment(acc, revs[0]))
  }

  await Promise.all(promises)
}

export const collectColumns = async (
  output: ExpShowOutput
): Promise<Column[]> => {
  const acc: ColumnAccumulator = { collected: new Set(), columns: {} }

  acc.columns.timestamp = timestampColumn

  const promises = []
  for (const expState of output) {
    if (!experimentHasError(expState)) {
      promises.push(collectFromExperiment(acc, expState))
    }

    promises.push(collectFromExperiments(acc, expState.experiments))
  }
  await Promise.all(promises)

  const columns = Object.values(acc.columns)
  const hasNoData = isEqual(columns, [timestampColumn])

  return hasNoData ? [] : columns
}

export const getExpData = (expState: ExpState): ExpData | undefined => {
  if (experimentHasError(expState)) {
    return
  }
  return expState.data
}

export const collectChanges = (output: ExpShowOutput): string[] => {
  const changes: string[] = []

  if (!(output.length > 1)) {
    return changes
  }

  const [workspaceData, baselineData] = output
  const workspace = getExpData(workspaceData)
  const baseline = getExpData(baselineData)

  if (!(workspace && baseline)) {
    return changes
  }

  collectMetricAndParamChanges(changes, workspace, baseline)
  collectDepChanges(changes, workspace, baseline)

  return sortCollectedArray(changes)
}

export const collectParamsFiles = (
  dvcRoot: string,
  output: ExpShowOutput
): Set<string> => {
  const [workspace] = output
  if (experimentHasError(workspace)) {
    return new Set()
  }
  const files = Object.keys(workspace?.data?.params || {})
    .filter(Boolean)
    .map(file => standardizePath(join(dvcRoot, file)))
  return new Set(files)
}

export const collectRelativeMetricsFiles = (
  output: ExpShowOutput
): string[] => {
  if (!output?.length) {
    return []
  }

  const [workspace] = output
  if (experimentHasError(workspace)) {
    return []
  }
  const files = Object.keys(workspace.data?.metrics || {})
    .filter(Boolean)
    .sort()

  return uniqueValues(files)
}

const collectChangedPath = (
  acc: string[],
  path: string,
  pathArray: string[],
  records: (Commit | Experiment)[]
) => {
  let initialValue
  for (const experiment of records) {
    if (initialValue === undefined) {
      initialValue = getValue(experiment, pathArray)
      continue
    }
    const value = getValue(experiment, pathArray)
    if (value === undefined || isEqual(value, initialValue)) {
      continue
    }

    acc.push(path)
    return
  }
}

const collectChangedPaths = (
  columns: Column[],
  records: (Commit | Experiment)[]
) => {
  const acc: string[] = []
  for (const { type, pathArray, path, hasChildren } of columns) {
    if (type === ColumnType.TIMESTAMP) {
      collectChangedPath(acc, path, [path], records)
      continue
    }

    if (!pathArray || hasChildren) {
      continue
    }
    collectChangedPath(acc, path, pathArray, records)
  }
  return acc
}

export const collectColumnsWithChangedValues = (
  selectedColumns: Column[],
  rows: Commit[],
  filters: FilterDefinition[]
): Column[] => {
  const records = []
  for (const commit of rows) {
    if (
      commit.id === EXPERIMENT_WORKSPACE_ID ||
      filterExperiment(filters, commit as Experiment)
    ) {
      records.push(commit)
    }
    if (commit.subRows) {
      records.push(...commit.subRows)
    }
  }

  const changedPaths = collectChangedPaths(selectedColumns, records)

  return selectedColumns.filter(({ path }) =>
    changedPaths.find(changedPath => changedPath.startsWith(path))
  )
}
