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
  ExpData,
  experimentHasError
} from '../../../cli/dvc/contract'
import { standardizePath } from '../../../fileSystem/path'
import { timestampColumn } from '../constants'
import { sortCollectedArray } from '../../../util/array'

const collectFromExperiment = (
  acc: ColumnAccumulator,
  experiment: ExpState
) => {
  if (experimentHasError(experiment)) {
    return
  }

  const { data } = experiment
  if (data) {
    collectMetricsAndParams(acc, data)
    collectDeps(acc, data)
  }
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

export const collectColumns = (output: ExpShowOutput): Column[] => {
  const acc: ColumnAccumulator = {}

  acc.timestamp = timestampColumn

  for (const expState of output) {
    if (experimentHasError(expState)) {
      continue
    }

    collectFromExperiment(acc, expState)
    collectFromExperiments(acc, expState.experiments)
  }

  const columns = Object.values(acc)
  const hasNoData = isEqual(columns, [timestampColumn])

  return hasNoData ? [] : columns
}

export const getData = (expState: ExpState): ExpData | undefined => {
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
  const workspace = getData(workspaceData)
  const baseline = getData(baselineData)

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
  const files = Object.keys(workspace.data.params || {})
    .filter(Boolean)
    .map(file => standardizePath(join(dvcRoot, file)))
  return new Set(files)
}

export const collectRelativeMetricsFiles = (
  output: ExpShowOutput
): string[] => {
  const [workspace] = output
  if (experimentHasError(workspace)) {
    return []
  }
  const files = Object.keys(workspace.data.metrics || {})
    .filter(Boolean)
    .sort()

  return [...new Set(files)]
}
