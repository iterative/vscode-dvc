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
import dayjs from '../../dayjs'
import { Table } from '../Table'
import styles from '../Table/styles.module.scss'
import buildDynamicColumns from '../../util/buildDynamicColumns'
import { Model } from '../../model'

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

const reportResizedColumn = (state: TableState<Experiment>, model: Model) => {
  const columnId = state.columnResizing.isResizingColumn
  if (columnId) {
    const columnWidth = state.columnResizing.columnWidths[columnId]
    model.persistColumnWidth(columnId, columnWidth)
  }
}

export const ExperimentsTable: React.FC<{
  tableData: TableData
  model: Model
}> = ({ tableData, model }) => {
  const { data, columns, initialState, defaultColumn } = React.useMemo(() => {
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
    return { columns, data, defaultColumn, initialState }
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
    useFlexLayout,
    hooks => {
      hooks.stateReducers.push((state, action) => {
        if (action.type === 'set-ungrouped') {
          return {
            ...state,
            ungrouped: action.setting || !state.ungrouped
          }
        }
        if (action.type === 'columnDoneResizing') {
          reportResizedColumn(state, model)
        }
        return state
      })
    },
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
      model={model}
      instance={instance}
      sorts={tableData.sorts}
      changes={tableData.changes}
    />
  )
}

const Experiments: React.FC<{
  tableData?: TableData | null
  model: Model
}> = ({ tableData, model }) => {
  return (
    <div className={styles.experiments}>
      {tableData ? (
        <ExperimentsTable tableData={tableData} model={model} />
      ) : (
        <p>Loading experiments...</p>
      )}
    </div>
  )
}

export default Experiments
