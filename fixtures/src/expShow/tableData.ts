import { TableData } from 'dvc/src/experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  rows: rowsFixture,
  columns: columnsFixture,
  sorts: [],
  changes: [],
  columnOrder: [],
  columnWidths: {}
}

export default tableDataFixture
