import columns from './columns'
import rows from './rows'
import defaultData from '../base/tableData'
import { TableData } from '../../../../experiments/webview/contract'

const data: TableData = {
  ...defaultData,
  columns,
  rows,
  selectedForPlotsCount: 0,
  sorts: [
    {
      path: 'params:params.yaml:epochs',
      descending: true
    }
  ]
}

export default data
