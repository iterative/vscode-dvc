import { TableData } from '../../../../experiments/webview/contract'
import rowsFixture from './rows'
import columnsFixture from './columns'
import defaultData from '../base/tableData'

const data: TableData = {
  ...defaultData,
  columns: columnsFixture,
  rows: rowsFixture
}

export default data
