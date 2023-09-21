import { Column, ColumnType } from '../webview/contract'

const type = ColumnType.TIMESTAMP

export const timestampColumn: Column = {
  firstValueType: type,
  hasChildren: false,
  label: 'Created',
  path: 'Created',
  type
}

export const EXPERIMENT_COLUMN_ID = 'id'

export const COMMIT_COLUMN_ID = 'commit'
export const BRANCH_COLUMN_ID = 'branch'

export const DEFAULT_COLUMN_IDS = [
  EXPERIMENT_COLUMN_ID,
  BRANCH_COLUMN_ID,
  COMMIT_COLUMN_ID
]
