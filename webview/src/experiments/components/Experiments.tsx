import React, { useCallback } from 'react'
import {
  Column,
  Row,
  TableData,
  InitiallyUndefinedTableData,
  ColumnType
} from 'dvc/src/experiments/webview/contract'
import {
  Row as TableRow,
  Column as TableColumn,
  useTable,
  useExpanded,
  useFlexLayout,
  useColumnOrder,
  useResizeColumns,
  TableState,
  Cell
} from 'react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { Table } from './table/Table'
import styles from './table/styles.module.scss'
import { AddColumns, Welcome } from './GetStarted'
import buildDynamicColumns from '../util/buildDynamicColumns'
import { sendMessage } from '../../shared/vscode'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { DragDropProvider } from '../../shared/components/dragDrop/DragDropContext'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

const DEFAULT_COLUMN_WIDTH = 90
const MINIMUM_COLUMN_WIDTH = 90

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit'
})
const dateFormatter = new Intl.DateTimeFormat([], {
  dateStyle: 'medium'
})

const countRowsAndAddIndexes: (
  rows: TableRow<Row>[],
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

const ExperimentHeader = () => (
  <div className={styles.experimentHeader}>Experiment</div>
)

const TimestampHeader = () => (
  <div className={styles.timestampHeader}>Timestamp</div>
)

const DateCellContents: React.FC<{ value: string }> = ({ value }) => {
  const date = new Date(value)
  return (
    <span className={styles.cellContents}>
      <div className={styles.timestampTime}>{timeFormatter.format(date)}</div>
      <div className={styles.timestampDate}>{dateFormatter.format(date)}</div>
    </span>
  )
}

const getColumns = (columns: Column[]): TableColumn<Row>[] =>
  [
    {
      Cell: ({
        row: {
          original: { label, displayNameOrParent }
        }
      }: Cell<Row>) => {
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
      Header: ExperimentHeader,
      accessor: 'id',
      id: 'id',
      width: 150
    },
    {
      Cell: ({ value }: { value: string }) => {
        return (
          <div className={styles.timestampInnerCell}>
            {value && <DateCellContents value={value} />}
          </div>
        )
      },
      Header: TimestampHeader,
      accessor: 'timestamp',
      width: 100
    },
    ...buildDynamicColumns(columns, ColumnType.METRICS),
    ...buildDynamicColumns(columns, ColumnType.PARAMS),
    ...buildDynamicColumns(columns, ColumnType.DEPS)
  ] as TableColumn<Row>[]

const reportResizedColumn = (state: TableState<Row>) => {
  const id = state.columnResizing.isResizingColumn
  if (id) {
    const width = state.columnResizing.columnWidths[id]
    sendMessage({
      payload: { id, width },
      type: MessageFromWebviewType.RESIZE_COLUMN
    })
  }
}

export const ExperimentsTable: React.FC<{
  tableData: InitiallyUndefinedTableData
}> = ({ tableData: initiallyUndefinedTableData }) => {
  const getRowId = useCallback(
    (experiment: Row, relativeIndex: number, parent?: TableRow<Row>) =>
      parent ? [parent.id, experiment.id].join('.') : String(relativeIndex),
    []
  )
  const [tableData, columns, defaultColumn, initialState] =
    React.useMemo(() => {
      const tableData: TableData = {
        changes: [],
        columnOrder: [],
        columnWidths: {},
        columns: [],
        filters: [],
        hasCheckpoints: false,
        hasColumns: false,
        hasRunningExperiment: false,
        rows: [],
        sorts: [],
        ...initiallyUndefinedTableData
      }

      const initialState = {
        columnOrder: tableData.columnOrder,
        columnResizing: {
          columnWidths: tableData.columnWidths
        }
      } as Partial<TableState<Row>>

      const defaultColumn: Partial<TableColumn<Row>> = {
        minWidth: MINIMUM_COLUMN_WIDTH,
        width: DEFAULT_COLUMN_WIDTH
      }

      const columns = getColumns(tableData.columns)
      return [tableData, columns, defaultColumn, initialState]
    }, [initiallyUndefinedTableData])

  const { hasColumns, rows: data } = tableData

  const instance = useTable<Row>(
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

  const hasOnlyDefaultColumns = columns.length <= 2
  const hasOnlyWorkspace = data.length <= 1
  if (hasOnlyDefaultColumns || hasOnlyWorkspace) {
    return (
      <GetStarted
        addItems={<AddColumns />}
        showEmpty={!hasColumns || hasOnlyWorkspace}
        welcome={<Welcome />}
      />
    )
  }

  return (
    <DragDropProvider>
      <Table instance={instance} tableData={tableData} />
    </DragDropProvider>
  )
}

const Experiments: React.FC<{
  tableData?: TableData | null
}> = ({ tableData }) => {
  return (
    <WebviewWrapper className={styles.experiments}>
      {tableData ? (
        <ExperimentsTable tableData={tableData} />
      ) : (
        <EmptyState>Loading Experiments...</EmptyState>
      )}
    </WebviewWrapper>
  )
}

export default Experiments
