import { join } from 'path'
import get from 'lodash.get'
import isEqual from 'lodash.isequal'
import { ColumnAccumulator } from './util'
import { collectDepChanges, collectDeps } from './deps'
import {
  collectMetricAndParamChanges,
  collectMetricsAndParams
} from './metricsAndParams'
import { Column, Commit, Experiment } from '../../webview/contract'
import {
  ExpRange,
  ExpShowOutput,
  ExpState,
  ExpData,
  experimentHasError,
  Value
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
    if (experimentHasError(expState)) {
      continue
    }

    promises.push(
      collectFromExperiment(acc, expState),
      collectFromExperiments(acc, expState.experiments)
    )
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

const checkColumn = (
  path: string,
  pathArray: string[],
  columns: string[],
  records: (Commit | Experiment)[]
  // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
  let initialValue
  for (const experiment of records) {
    if (initialValue === undefined) {
      initialValue = get(experiment, pathArray) as Value
      continue
    }
    const value = get(experiment, pathArray) as Value
    if (value === undefined) {
      continue
    }
    if (!isEqual(value, initialValue)) {
      columns.push(path)
      return
    }
  }
}

const getChangedPaths = (
  columns: Column[],
  records: (Commit | Experiment)[]
) => {
  const changedPaths: string[] = []
  for (const { pathArray, path, hasChildren } of columns) {
    if (!pathArray || hasChildren) {
      continue
    }
    checkColumn(path, pathArray, changedPaths, records)
  }
  return changedPaths
}

export const collectColumnsWithChangedValues = (
  selectedColumns: Column[],
  rows: Commit[],
  filters: FilterDefinition[]
): Column[] => {
  const records = []
  for (const commit of rows) {
    if (filterExperiment(filters, commit as Experiment)) {
      records.push(commit)
    }
    if (commit.subRows) {
      records.push(...commit.subRows)
    }
  }

  const paths = getChangedPaths(selectedColumns, records)

  return selectedColumns.filter(({ path }) =>
    paths.find(changedPath => changedPath.startsWith(path))
  )
}
