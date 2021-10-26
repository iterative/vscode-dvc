import complexRowData from 'dvc/src/test/fixtures/complex-row-example'
import complexColumnData from 'dvc/src/test/fixtures/complex-column-example'
import complexChangesData from 'dvc/src/test/fixtures/complex-changes-example'
import { TableData } from 'dvc/src/experiments/webview/contract'

const complexTableData: TableData = {
  changes: complexChangesData,
  columns: complexColumnData,
  columnsOrder: [],
  rows: complexRowData,
  sorts: [
    { descending: true, path: 'params:params.yaml:epochs' },
    { descending: false, path: 'params:params.yaml:log_file' }
  ]
}

export default complexTableData
