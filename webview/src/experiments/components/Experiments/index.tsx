import React from 'react'
import {
  MetricOrParam,
  RowData as Experiment,
  TableData,
  InitiallyUndefinedTableData
} from 'dvc/src/experiments/webview/contract'
import {
  Row,
  Column,
  useTable,
  useExpanded,
  useFlexLayout,
  useColumnOrder,
  useResizeColumns,
  TableState,
  Cell
} from 'react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import dayjs from '../../dayjs'
import { Table } from '../Table'
import styles from '../Table/styles.module.scss'
import buildDynamicColumns from '../../util/buildDynamicColumns'
import { sendMessage } from '../../../shared/vscode'

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

const getExperimentDisplayName = (
  id: string,
  name: string | undefined,
  isBranchRow: boolean
) => {
  if (id === 'workspace') {
    return id
  } else if (isBranchRow) {
    return name
  } else {
    return id.slice(0, 7)
  }
}

const ExperimentHeaderCell = () => (
  <div className={styles.experimentHeaderCell}>Experiment</div>
)

const getColumns = (columns: MetricOrParam[]): Column<Experiment>[] =>
  [
    {
      Cell: ({
        value,
        row: {
          depth,
          original: { name }
        }
      }: Cell<Experiment>) => {
        const isBranchRow = depth === 0
        return (
          <div className={styles.experimentCellContents}>
            <span className={styles.experimentCellPrimaryName}>
              {getExperimentDisplayName(value, name, isBranchRow)}
            </span>
            {!isBranchRow && name && (
              <span className={styles.experimentCellSecondaryName}>
                [{name}]
              </span>
            )}
          </div>
        )
      },
      Header: ExperimentHeaderCell,
      accessor: 'id',
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
    ...buildDynamicColumns(columns, 'metrics'),
    ...buildDynamicColumns(columns, 'params')
  ] as Column<Experiment>[]

const reportResizedColumn = (state: TableState<Experiment>) => {
  const id = state.columnResizing.isResizingColumn
  if (id) {
    const width = state.columnResizing.columnWidths[id]
    sendMessage({
      payload: { id, width },
      type: MessageFromWebviewType.COLUMN_RESIZED
    })
  }
}

export const ExperimentsTable: React.FC<{
  tableData: InitiallyUndefinedTableData
}> = ({ tableData: initiallyUndefinedTableData }) => {
  const [tableData, columns, defaultColumn, initialState] =
    React.useMemo(() => {
      const tableData: TableData = {
        changes: [],
        columnOrder: [],
        columnWidths: {},
        columns: [],
        rows: [],
        sorts: [],
        ...initiallyUndefinedTableData
      }

      const initialState: Partial<TableState<Experiment>> = {
        columnOrder: tableData.columnOrder
      }

      const defaultColumn: Partial<Column<Experiment>> = {
        minWidth: DEFAULT_COLUMN_WIDTH
      }

      const columns = getColumns(tableData.columns)
      return [tableData, columns, defaultColumn, initialState]
    }, [initiallyUndefinedTableData])

  const { rows: data, columnWidths } = tableData

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

  return <Table instance={instance} tableData={tableData} />
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
