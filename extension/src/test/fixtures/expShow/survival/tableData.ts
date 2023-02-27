import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const data: TableData = {
  filteredCounts: { experiments: 0, checkpoints: 0 },
  rows: rowsFixture,
  columns: columnsFixture,
  filters: [],
  hasCheckpoints: true,
  hasConfig: true,
  hasRunningExperiment: true,
  hasColumns: true,
  hasValidDvcYaml: true,
  sorts: [],
  changes: [],
  columnOrder: [],
  columnWidths: {}
}

export default data
