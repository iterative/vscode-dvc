import { ColumnAccumulator } from './util'
import { ColumnType } from '../../webview/contract'

export const timestampColumn = {
  hasChildren: false,
  label: 'Timestamp',
  parentPath: ColumnType.TIMESTAMP,
  path: 'Timestamp',
  type: ColumnType.TIMESTAMP
}

export const collectTimestamp = (acc: ColumnAccumulator) => {
  acc.timestamp = timestampColumn
}
