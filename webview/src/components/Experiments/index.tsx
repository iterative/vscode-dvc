import React from 'react'
import {
  ParamOrMetric,
  RowData as Experiment,
  TableData
} from 'dvc/src/experiments/webview/contract'
import {
  Row,
  Column,
  useTable,
  useGroupBy,
  useExpanded,
  useFlexLayout
} from 'react-table'
import dayjs from '../../dayjs'
import { Table } from '../Table'
import styles from '../Table/styles.module.scss'
import buildDynamicColumns from '../../util/buildDynamicColumns'
import { VsCodeApi } from '../../model'

const countRowsAndAddIndexes: (
  rows: Row<Experiment>[],
  index?: number
) => number = (rows, index = 0) => {
  for (const row of rows) {
    row.flatIndex = index
    index += 1
    if (row.isExpanded) {
      index = countRowsAndAddIndexes(row.subRows, index)
    }
  }
  return index
}

const getColumns = (columns: ParamOrMetric[]): Column<Experiment>[] =>
  [
    {
      Header: 'Experiment',
      accessor: 'displayName',
      id: 'id',
      width: 150
    },
    {
      Cell: ({ value }: { value: string }) => {
        if (!value || value === '') {
          return null
        }
        const time = dayjs(value)
        return time.format(time.isToday() ? 'HH:mm:ss' : 'YYYY/MM/DD')
      },
      Header: 'Timestamp',
      accessor: 'timestamp'
    },
    ...buildDynamicColumns(columns, 'params'),
    ...buildDynamicColumns(columns, 'metrics')
  ] as Column<Experiment>[]

export const ExperimentsTable: React.FC<{
  data: TableData
}> = ({ data }) => {
  const [initialState, defaultColumn] = React.useMemo(() => {
    const initialState = {}
    const defaultColumn: Partial<Column<Experiment>> = {
      width: 110
    }
    return [initialState, defaultColumn]
  }, [])

  const [rows, columns] = React.useMemo(() => {
    const rows = data.rows
    const columns = getColumns(data.columns)
    return [rows, columns]
  }, [data])

  const instance = useTable<Experiment>(
    {
      autoResetExpanded: false,
      columns,
      data: rows,
      defaultColumn,
      expandSubRows: false,
      initialState
    },
    useFlexLayout,
    hooks => {
      hooks.stateReducers.push((state, action) => {
        if (action.type === 'set-ungrouped') {
          return {
            ...state,
            ungrouped: action.setting || !state.ungrouped
          }
        }
        return state
      })
    },
    useGroupBy,
    useExpanded,
    hooks => {
      hooks.useInstance.push(instance => {
        const { rows } = instance
        const expandedRowCount = countRowsAndAddIndexes(rows)
        Object.assign(instance, {
          expandedRowCount
        })
      })
    }
  )

  const { toggleAllRowsExpanded } = instance

  React.useEffect(() => {
    toggleAllRowsExpanded()
  }, [toggleAllRowsExpanded])

  return (
    <>
      <Table instance={instance} sorts={data.sorts} changes={data.changes} />
    </>
  )
}

const Experiments: React.FC<{
  vsCodeApi: VsCodeApi
  data?: TableData | null
}> = ({ data }) => {
  return (
    <div className={styles.experiments}>
      {data ? <ExperimentsTable data={data} /> : <p>Loading experiments...</p>}
    </div>
  )
}

export default Experiments
