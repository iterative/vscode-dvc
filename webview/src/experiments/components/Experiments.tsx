import React, { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Column, Row, ColumnType } from 'dvc/src/experiments/webview/contract'
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
import { RowSelectionProvider } from './table/RowSelectionContext'
import buildDynamicColumns from '../util/buildDynamicColumns'
import { sendMessage } from '../../shared/vscode'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { ExperimentsState } from '../store'

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

const getColumns = (columns: Column[]): TableColumn<Row>[] => {
  const includeTimestamp = columns.some(
    ({ type }) => type === ColumnType.TIMESTAMP
  )

  const builtColumns = [
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
      minWidth: 250,
      width: 250
    },
    ...buildDynamicColumns(columns, ColumnType.METRICS),
    ...buildDynamicColumns(columns, ColumnType.PARAMS),
    ...buildDynamicColumns(columns, ColumnType.DEPS)
  ] as TableColumn<Row>[]

  if (includeTimestamp) {
    builtColumns.splice(1, 0, {
      Cell: ({ value }) => {
        return (
          <div className={styles.timestampInnerCell}>
            {value && <DateCellContents value={value} />}
          </div>
        )
      },
      Header: TimestampHeader,
      accessor: 'Timestamp',
      group: ColumnType.TIMESTAMP,
      id: 'Timestamp',
      name: 'Timestamp',
      width: 100
    })
  }

  return builtColumns
}

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

const defaultColumn: Partial<TableColumn<Row>> = {
  minWidth: MINIMUM_COLUMN_WIDTH,
  width: DEFAULT_COLUMN_WIDTH
}

export const ExperimentsTable: React.FC = () => {
  const {
    columns: columnsData,
    columnOrder,
    columnWidths,
    hasColumns,
    rows: data
  } = useSelector((state: ExperimentsState) => state.tableData)
  const columns = getColumns(columnsData)
  const initialState = {
    columnOrder,
    columnResizing: {
      columnWidths
    }
  } as Partial<TableState<Row>>

  const getRowId = useCallback(
    (experiment: Row, relativeIndex: number, parent?: TableRow<Row>) =>
      parent ? [parent.id, experiment.id].join('.') : String(relativeIndex),
    []
  )

  const instance = useTable<Row>(
    {
      autoResetExpanded: false,
      autoResetHiddenColumns: false,
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
        if (action.type === 'columnStartResizing') {
          document.body.classList.add(styles.noSelect)
        }
        if (action.type === 'columnDoneResizing') {
          reportResizedColumn(state)
          document.body.classList.remove(styles.noSelect)
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

  useEffect(() => {
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
    <RowSelectionProvider>
      <Table instance={instance} />
    </RowSelectionProvider>
  )
}

const Experiments: React.FC = () => {
  const { hasData } = useSelector((state: ExperimentsState) => state.tableData)
  return (
    <WebviewWrapper className={styles.experiments}>
      {hasData ? (
        <ExperimentsTable />
      ) : (
        <EmptyState>Loading Experiments...</EmptyState>
      )}
    </WebviewWrapper>
  )
}

export default Experiments
