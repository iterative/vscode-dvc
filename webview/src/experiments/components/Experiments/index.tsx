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
  useResizeColumns
} from 'react-table'
import dayjs from '../../dayjs'
import { Table } from '../Table'
import styles from '../Table/styles.module.scss'
import buildDynamicColumns from '../../util/buildDynamicColumns'
import { useColumnResize } from '../../hooks/useColumnResize'

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

export const ExperimentsTable: React.FC<{
  tableData: TableData
}> = ({ tableData }) => {
  const [columnsWidth, setColumnWidth] = useColumnResize()
  const [initialState, defaultColumn] = React.useMemo(() => {
    const initialState = {}
    const defaultColumn: Partial<Column<Experiment>> = {
      minWidth: DEFAULT_COLUMN_WIDTH
    }
    return [initialState, defaultColumn]
  }, [])

  const [data, columns] = React.useMemo(() => {
    const data = tableData.rows
    const columns = getColumns(tableData.columns)
    return [data, columns]
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
          const columnId = Object.keys(state.columnResizing.columnWidths)[0]
          const columnWidth = state.columnResizing.columnWidths[columnId]
          setColumnWidth(columnId, columnWidth)
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
        const { rows, allColumns } = instance
        const expandedRowCount = countRowsAndAddIndexes(rows)
        Object.assign(instance, {
          expandedRowCount
        })
        allColumns.forEach(column => {
          column.width =
            columnsWidth.find(c => c.path === column.id)?.width ||
            DEFAULT_COLUMN_WIDTH
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
      columnsOrder={tableData.columnsOrder?.map(column => column.path)}
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
