import { TableData } from '../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const tableDataFixture: TableData = {
  activeWorkerCount: 0,
  filteredCounts: { experiments: 0, checkpoints: 0 },
  rows: rowsFixture,
  columns: columnsFixture,
  filters: [],
  hasCheckpoints: true,
  hasRunningExperiment: true,
  hasColumns: true,
  sorts: [],
  changes: [],
  columnOrder: [],
  columnWidths: {}
}

export default tableDataFixture
