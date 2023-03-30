import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'

const data: TableData = {
  filteredCount: 0,
  rows: rowsFixture,
  columns: columnsFixture,
  filters: [],
  hasCheckpoints: true,
  hasConfig: true,
  hasRunningExperiment: true,
  hasColumns: true,
  hasMoreCommits: true,
  hasValidDvcYaml: true,
  isShowingMoreCommits: true,
  sorts: [],
  changes: [],
  columnOrder: [],
  columnWidths: {}
}

export default data
