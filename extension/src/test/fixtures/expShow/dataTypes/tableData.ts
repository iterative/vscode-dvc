import columns from './columns'
import defaultData from '../base/tableData'
import rows from './rows'
import { TableData } from '../../../../experiments/webview/contract'

export const data: TableData = {
  ...defaultData,
  columns,
  hasCheckpoints: false,
  hasRunningWorkspaceExperiment: false,
  rows,
  selectedForPlotsCount: 0
}

export default data
