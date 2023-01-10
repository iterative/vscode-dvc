import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Column,
  Row,
  ColumnType,
  Experiment
} from 'dvc/src/experiments/webview/contract'
import {
  ColumnDef,
  CellContext,
  useReactTable,
  TableState,
  Row as TableRow,
  getCoreRowModel,
  HeaderContext,
  getExpandedRowModel
} from '@tanstack/react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { Table } from './table/Table'
import styles from './table/styles.module.scss'
import { AddColumns, Welcome } from './GetStarted'
import { RowSelectionProvider } from './table/RowSelectionContext'
import { buildColumns, columnHelper } from '../util/buildColumns'
import { sendMessage } from '../../shared/vscode'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { ExperimentsState } from '../store'
import { EXPERIMENT_COLUMN_ID } from '../util/columns'
import { Header } from './table/content/Header'
import { CellValue } from './table/content/Cell'

const DEFAULT_COLUMN_WIDTH = 90
const MINIMUM_COLUMN_WIDTH = 90

/*const countRowsAndAddIndexes: (
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
}*/

const ExperimentHeader = (context: HeaderContext<Column, unknown>) =>
  context.header.isPlaceholder ? (
    ''
  ) : (
    <div className={styles.experimentHeader}>Experiment</div>
  )

const getDefaultColumnWithIndicatorsPlaceHolder = () => {
  return columnHelper.accessor(() => EXPERIMENT_COLUMN_ID, {
    cell: (cell: CellContext<Column, CellValue>) => {
      const {
        row: {
          original: { label, displayNameOrParent }
        }
      } = cell as unknown as CellContext<Experiment, CellValue>
      return (
        <div className={styles.experimentCellContents}>
          <span>{label}</span>
          {displayNameOrParent && (
            <span className={styles.experimentCellSecondaryName}>
              {displayNameOrParent}
            </span>
          )}
        </div>
      )
    },
    header: ExperimentHeader,
    id: EXPERIMENT_COLUMN_ID,
    minSize: 215,
    size: 215
  })
}

const getColumns = (columns: Column[]) => {
  const includeTimestamp = columns.some(
    ({ type }) => type === ColumnType.TIMESTAMP
  )

  const timestampColumn =
    (includeTimestamp &&
      buildColumns(
        [
          {
            path: 'Created',
            parentPath: ColumnType.TIMESTAMP,
            hasChildren: false,
            label: 'Created',
            type: ColumnType.TIMESTAMP,
            width: 100
          }
        ],
        ColumnType.TIMESTAMP
      )) ||
    []

  const builtColumns = [
    getDefaultColumnWithIndicatorsPlaceHolder(),
    ...timestampColumn,
    ...buildColumns(columns, ColumnType.METRICS),
    ...buildColumns(columns, ColumnType.PARAMS),
    ...buildColumns(columns, ColumnType.DEPS)
  ]

  return builtColumns
}

/*const reportResizedColumn = (state: TableState<Row>) => {
  const id = state.columnResizing.isResizingColumn
  if (id) {
    const width = state.columnResizing.columnWidths[id]
    sendMessage({
      payload: { id, width },
      type: MessageFromWebviewType.RESIZE_COLUMN
    })
  }
}*/

const defaultColumn: Partial<ColumnDef<Row>> = {
  minSize: MINIMUM_COLUMN_WIDTH,
  size: DEFAULT_COLUMN_WIDTH
}

export const ExperimentsTable: React.FC = () => {
  const {
    columns: columnsData,
    columnOrder,
    columnWidths,
    hasColumns,
    rows: data
  } = useSelector((state: ExperimentsState) => state.tableData)

  const [expanded, setExpanded] = useState({})

  const columns = getColumns(columnsData)
  const initialState = {
    columnOrder,
    columnResizing: {
      columnWidths
    },
    expanded
  } as Partial<TableState>

  const getRowId = useCallback(
    (experiment: Row, relativeIndex: number, parent?: TableRow<Row>) =>
      parent ? [parent.id, experiment.id].join('.') : String(relativeIndex),
    []
  )

  const instance = useReactTable<Row>(
    {
      autoResetAll: false,
      columnResizeMode: 'onChange',
      columns,
      data,
      defaultColumn,
      getCoreRowModel: getCoreRowModel(),
      getRowId,
      //initialState,
      onExpandedChange: setExpanded,
      getSubRows: row => row.subRows,
      getExpandedRowModel: getExpandedRowModel(),
      state: {
        columnOrder,
        expanded
      }
    }
    /*hooks => {
      hooks.stateReducers.push((state, action) => {
        if (action.type === 'columnStartResizing') {
          document.body.classList.add(styles.isColumnResizing)
        }
        if (action.type === 'columnDoneResizing') {
          reportResizedColumn(state)
          document.body.classList.remove(styles.isColumnResizing)
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
    }*/
  )

  const { toggleAllRowsExpanded } = instance

  useEffect(() => {
    toggleAllRowsExpanded()
  }, [toggleAllRowsExpanded])

  const hasOnlyDefaultColumns = columns.length <= 1
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
