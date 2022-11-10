import { Column, ColumnType } from '../webview/contract'

const type = ColumnType.TIMESTAMP

export const timestampColumn: Column = {
  hasChildren: false,
  label: 'Created',
  path: 'Created',
  type,
  types: [type]
}

export const EXPERIMENT_COLUMN_ID = 'id'
