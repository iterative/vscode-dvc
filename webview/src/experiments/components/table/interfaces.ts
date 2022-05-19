import { Experiment, TableData } from 'dvc/src/experiments/webview/contract'
import { Cell, Row, TableInstance } from 'react-table'

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export interface TableProps extends InstanceProp {
  tableData: TableData
}

export interface WithChanges {
  changes?: string[]
}

export interface RowProp {
  row: Row<Experiment>
  contextMenuDisabled?: boolean
  projectHasCheckpoints?: boolean
}

export interface CellProp {
  cell: Cell<Experiment>
}
