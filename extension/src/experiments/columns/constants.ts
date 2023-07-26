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
