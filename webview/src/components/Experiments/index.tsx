import React from 'react'
import {
  ColumnData,
  Experiment,
  TableData
} from 'dvc/src/experiments/webview/contract'
import {
  Row,
  Column,
  ColumnInstance,
  useTable,
  useGroupBy,
  useExpanded,
  useSortBy,
  useFlexLayout,
  SortByFn
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

const isDesc = (direction: boolean | 'desc') =>
  direction === false || direction === 'desc'

const sortByDirection = (desc: boolean, sortInt: number) =>
  desc ? -sortInt : sortInt

const sortByFirstDirection = (
  direction: boolean | 'desc',
  rowA: Row<Experiment>,
  rowB: Row<Experiment>
) => (isDesc(direction) ? rowA.index - rowB.index : rowB.index - rowA.index)

const getSortedRows = (
  rows: Row<Experiment>[],
  sortFns: SortByFn<Experiment>[],
  directions: (boolean | 'desc')[]
): Row<Experiment>[] =>
  [...rows].sort((rowA, rowB) => {
    for (let i = 0; i < sortFns.length; i += 1) {
      const sortFn = sortFns[i]
      const desc = isDesc(directions[i])
      const sortInt = sortFn(rowA, rowB, '', desc)
      if (sortInt !== 0) {
        return sortByDirection(desc, sortInt)
      }
    }
    return sortByFirstDirection(directions[0], rowA, rowB)
  })

const orderByFn = (
  rows: Row<Experiment>[],
  sortFns: SortByFn<Experiment>[],
  directions: (boolean | 'desc')[],
  parentRow: Row<Experiment>
): Row<Experiment>[] => {
  if (parentRow && parentRow.depth === 0) {
    return getSortedRows(rows, sortFns, directions)
  } else {
    return rows
  }
}

const getColumns = (columns: ColumnData[]): Column<Experiment>[] =>
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
  const hiddenColumns = tableData.columns
    .filter(column => !column.isSelected)
    .map(column => {
      const sep = column.path.includes('/') ? '/' : '\\'
      return column.path
        .split(sep)
        .map(segment => `[${segment}]`)
        .join('')
    })

  const [initialState, defaultColumn] = React.useMemo(() => {
    const initialState = { hiddenColumns }
    const defaultColumn: Partial<Column<Experiment>> = {
      width: 110
    }
    return [initialState, defaultColumn]
  }, [hiddenColumns])

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
      initialState,
      orderByFn
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
    useSortBy,
    useExpanded,
    hooks => {
      hooks.useInstance.push(instance => {
        const { allColumns, rows } = instance
        const sortedColumns: ColumnInstance<Experiment>[] = allColumns.filter(
          column => column.isSorted
        )
        const expandedRowCount = countRowsAndAddIndexes(rows)
        Object.assign(instance, {
          expandedRowCount,
          sortedColumns
        })
      })
    }
  )

  const { toggleAllRowsExpanded, toggleHideColumn } = instance

  React.useEffect(() => {
    toggleAllRowsExpanded()
  }, [toggleAllRowsExpanded])

  React.useEffect(() => {
    tableData.columns.forEach(column => {
      const sep = column.path.includes('/') ? '/' : '\\'
      const id = column.path
        .split(sep)
        .map(segment => `[${segment}]`)
        .join('')
      const isSelected = !column.isSelected
      toggleHideColumn(id, isSelected)
    })
  }, [toggleHideColumn, tableData.columns])

  return (
    <>
      <Table instance={instance} />
    </>
  )
}

const Experiments: React.FC<{
  vsCodeApi: VsCodeApi
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
