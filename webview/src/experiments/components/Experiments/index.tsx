import React, { useCallback } from 'react'
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

const DEFAULT_COLUMN_WIDTH = 75
const MINIMUM_COLUMN_WIDTH = 50

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

const ExperimentHeaderCell = () => (
  <div className={styles.experimentHeaderCell}>Experiment</div>
)

const getColumns = (columns: MetricOrParam[]): Column<Experiment>[] =>
  [
    {
      Cell: ({
        row: {
          original: { label, displayNameOrParent }
        }
      }: Cell<Experiment>) => {
        return (
          <div className={styles.experimentCellContents}>
            <span className={styles.experimentCellPrimaryName}>{label}</span>
            {displayNameOrParent && (
              <span className={styles.experimentCellSecondaryName}>
                {displayNameOrParent}
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
        return (
          <span className={styles.timestampCellContentsWrapper}>
            <span className={styles.cellContents}>
              {time.format(time.isToday() ? 'HH:mm:ss' : 'YYYY/MM/DD')}
            </span>
          </span>
        )
      },
      Header: 'Timestamp',
      accessor: 'timestamp',
      width: 100
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
  const getRowId = useCallback(({ id }: Experiment) => id, [])

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

      const initialState = {
        columnOrder: tableData.columnOrder,
        columnResizing: {
          columnWidths: tableData.columnWidths
        }
      } as Partial<TableState<Experiment>>

      const defaultColumn: Partial<Column<Experiment>> = {
        minWidth: MINIMUM_COLUMN_WIDTH,
        width: DEFAULT_COLUMN_WIDTH
      }

      const columns = getColumns(tableData.columns)
      return [tableData, columns, defaultColumn, initialState]
    }, [initiallyUndefinedTableData])

  const { rows: data } = tableData

  const instance = useTable<Experiment>(
    {
      autoResetExpanded: false,
      autoResetResize: false,
      columns,
      data,
      defaultColumn,
      expandSubRows: false,
      getRowId,
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
