import { Experiment } from 'dvc/src/experiments/webview/contract'
import { Cell, Row, Table } from '@tanstack/react-table'

export interface InstanceProp {
  instance: Table<Experiment>
}

export interface RowProp {
  row: Row<Experiment>
  hasRunningExperiment?: boolean
  projectHasCheckpoints?: boolean
  hideOnClick?: () => void
}

export interface CellProp {
  cell: Cell<Experiment, unknown>
}
