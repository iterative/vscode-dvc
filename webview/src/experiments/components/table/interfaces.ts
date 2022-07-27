import { Experiment } from 'dvc/src/experiments/webview/contract'
import { Cell, Row, TableInstance } from 'react-table'

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export interface RowProp {
  row: Row<Experiment>
  contextMenuDisabled?: boolean
  hasRunningExperiment?: boolean
  projectHasCheckpoints?: boolean
}

export interface CellProp {
  cell: Cell<Experiment>
}
