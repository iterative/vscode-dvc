import columns from './columns'
import rows from './rows'
import { TableData } from '../../../../experiments/webview/contract'

export const data: TableData = {
  changes: [],
  columnOrder: [],
  columnWidths: {},
  filteredCounts: { experiments: 0, checkpoints: 0 },
  filters: [],
  hasCheckpoints: false,
  hasConfig: true,
  hasRunningExperiment: false,
  sorts: [],
  columns,
  hasColumns: true,
  rows
}

export default data
