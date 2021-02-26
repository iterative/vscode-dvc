import { ExperimentJSONOutput } from 'dvc/src/DvcReader'
import { TableInstance, Row } from 'react-table'

export interface Experiment extends ExperimentJSONOutput {
  subRows?: Experiment[]
  id: string
}

export interface InstanceProp {
  instance: TableInstance<Experiment>
}

export interface RowProp {
  row: Row<Experiment>
}
