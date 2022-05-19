import { TableData } from '../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  rows: rowsFixture,
  columns: columnsFixture,
  hasCheckpoints: true,
  sorts: [],
  changes: [],
  columnOrder: [],
  columnWidths: {}
}

export default tableDataFixture
