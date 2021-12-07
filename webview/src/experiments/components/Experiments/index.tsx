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
  useFlexLayout,
  useColumnOrder,
  useResizeColumns,
  TableState
} from 'react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import dayjs from '../../dayjs'
import { Table } from '../Table'
import styles from '../Table/styles.module.scss'
import buildDynamicColumns from '../../util/buildDynamicColumns'
import { vsCodeApi } from '../../../shared/api'

const DEFAULT_COLUMN_WIDTH = 120

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

const reportResizedColumn = (state: TableState<Experiment>) => {
  const id = state.columnResizing.isResizingColumn
  if (id) {
    const width = state.columnResizing.columnWidths[id]
    vsCodeApi.postMessage({
      payload: { id, width },
      type: MessageFromWebviewType.COLUMN_RESIZED
    })
  }
}

export const ExperimentsTable: React.FC<{
  tableData: TableData
}> = ({ tableData }) => {
  const [columns, data, defaultColumn, initialState] = React.useMemo(() => {
    const { columnOrder } = tableData
    const initialState: Partial<TableState<Experiment>> = {
      columnOrder: tableData.columnOrder
    }
    if (columnOrder) {
      initialState.columnOrder = columnOrder
    }
    const defaultColumn: Partial<Column<Experiment>> = {
      minWidth: DEFAULT_COLUMN_WIDTH
    }
    const data = tableData.rows
    const columns = getColumns(tableData.columns)
    return [columns, data, defaultColumn, initialState]
  }, [tableData])

  const instance = useTable<Experiment>(
    {
      autoResetExpanded: false,
      columns,
      data,
      defaultColumn,
      expandSubRows: false,
      initialState
    },
    hooks => {
      hooks.stateReducers.push((state, action) => {
        if (action.type === 'columnDoneResizing') {
          reportResizedColumn(state)
        }
        return state
      })
    },
    useFlexLayout,
    useColumnOrder,
    useGroupBy,
    useExpanded,
    useResizeColumns,
    hooks => {
      hooks.useInstance.push(instance => {
        const { rows } = instance
        const expandedRowCount = countRowsAndAddIndexes(rows)
        Object.assign(instance, {
          expandedRowCount
        })
      })
      hooks.allColumns.push(allColumns => {
        const { columnWidths } = tableData
        if (columnWidths === undefined) {
          return allColumns
        }
        return allColumns.map(column => {
          const { id } = column
          const width = columnWidths[id]
          if (width !== undefined) {
            return {
              ...column,
              width
            }
          }
          return column
        })
      })
    }
  )

  const { toggleAllRowsExpanded } = instance

  React.useEffect(() => {
    toggleAllRowsExpanded()
  }, [toggleAllRowsExpanded])

  return (
    <Table
      instance={instance}
      sorts={tableData.sorts}
      changes={tableData.changes}
      tableData={tableData}
    />
  )
}

const Experiments: React.FC<{
  tableData?: TableData | null
}> = ({ tableData }) => {
  return (
    <div className={styles.experiments}>
      {tableData ? (
        <ExperimentsTable tableData={tableData} />
      ) : (
        <p>Loading experiments...</p>
      )}
    </div>
  )
}

export default Experiments
