import { Column, ColumnType } from '../../webview/contract'
import {
  EXPERIMENT_COLUMN_ID,
  BRANCH_COLUMN_ID,
  COMMIT_COLUMN_ID
} from '../constants'

export const collectColumnOrder = async (
  existingColumnOrder: string[],
  terminalNodes: Column[]
): Promise<string[]> => {
  const acc: { [columnType: string]: string[] } = {
    [ColumnType.DEPS]: [],
    [ColumnType.METRICS]: [],
    [ColumnType.PARAMS]: [],
    [ColumnType.TIMESTAMP]: []
  }
  for (const { type, path } of terminalNodes) {
    if (existingColumnOrder.includes(path)) {
      continue
    }
    acc[type].push(path)
  }

  // eslint-disable-next-line etc/no-assign-mutated-array
  await Promise.all([acc.metrics.sort(), acc.params.sort(), acc.deps.sort()])

  if (!existingColumnOrder.includes(EXPERIMENT_COLUMN_ID)) {
    existingColumnOrder.unshift(EXPERIMENT_COLUMN_ID)
  }

  if (!existingColumnOrder.includes(BRANCH_COLUMN_ID)) {
    existingColumnOrder.splice(1, 0, BRANCH_COLUMN_ID)
  }

  if (!existingColumnOrder.includes(COMMIT_COLUMN_ID)) {
    existingColumnOrder.splice(2, 0, COMMIT_COLUMN_ID)
  }

  return [
    ...existingColumnOrder,
    ...acc.timestamp,
    ...acc.metrics,
    ...acc.params,
    ...acc.deps
  ]
}
