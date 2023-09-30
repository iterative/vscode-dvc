import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useSelector } from 'react-redux'
import { Commit } from 'dvc/src/experiments/webview/contract'
import {
  ColumnDef,
  useReactTable,
  Row as TableRow,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnSizingState,
  ColumnOrderState
} from '@tanstack/react-table'
import { Table } from './table/Table'
import styles from './table/styles.module.scss'
import { ErrorState } from './emptyState/ErrorState'
import { AddColumns } from './emptyState/AddColumns'
import { AddStage } from './AddStage'
import { buildColumns } from './table/body/columns/Columns'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { ExperimentsState } from '../store'
import { resizeColumn } from '../util/messages'
import { isDefaultColumn } from '../util/columns'

const DEFAULT_COLUMN_WIDTH = 90
const MINIMUM_COLUMN_WIDTH = 90

const reportResizedColumn = (
  state: ColumnSizingState,
  columnWidths: ColumnSizingState,
  debounceTimer: MutableRefObject<number>
) => {
  for (const id of Object.keys(state)) {
    const width = state[id]
    if (width !== columnWidths[id]) {
      window.clearTimeout(debounceTimer.current)
      debounceTimer.current = window.setTimeout(() => {
        resizeColumn(id, width)
      }, 500)
    }
  }
}

const defaultColumn: Partial<ColumnDef<Commit>> = {
  minSize: MINIMUM_COLUMN_WIDTH,
  size: DEFAULT_COLUMN_WIDTH
}

export const ExperimentsTable: React.FC = () => {
  const {
    columnData,
    columnOrder: columnOrderData,
    columnWidths,
    hasConfig,
    rows: data,
    sorts
  } = useSelector((state: ExperimentsState) => state.tableData)

  const [expanded, setExpanded] = useState({})

  const [columns, setColumns] = useState(
    buildColumns(columnData, sorts.length > 0)
  )
  const [columnSizing, setColumnSizing] =
    useState<ColumnSizingState>(columnWidths)
  const [columnOrder, setColumnOrder] =
    useState<ColumnOrderState>(columnOrderData)
  const resizeTimeout = useRef(0)

  useEffect(() => {
    reportResizedColumn(columnSizing, columnWidths, resizeTimeout)
  }, [columnSizing, columnWidths])

  useEffect(() => {
    setColumns(buildColumns(columnData, sorts.length > 0))
  }, [columnData, sorts])

  useEffect(() => {
    setColumnOrder(columnOrderData)
  }, [columnOrderData])

  const getRowId = useCallback(
    (experiment: Commit, relativeIndex: number, parent?: TableRow<Commit>) =>
      parent ? [parent.id, experiment.id].join('.') : String(relativeIndex),
    []
  )

  const instance = useReactTable<Commit>({
    autoResetAll: false,
    columnResizeMode: 'onChange',
    columns: columns as ColumnDef<Commit, unknown>[],
    data,
    defaultColumn,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId,
    getSubRows: row => row.subRows,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    state: {
      columnOrder,
      columnSizing,
      expanded
    }
  })

  const { toggleAllRowsExpanded } = instance

  useEffect(() => {
    toggleAllRowsExpanded()
  }, [toggleAllRowsExpanded])

  const hasOnlyDefaultColumns = columns.every(
    ({ id }) => id && isDefaultColumn(id)
  )
  if (hasOnlyDefaultColumns) {
    return <AddColumns />
  }

  return (
    <>
      <Table instance={instance} />
      {!hasConfig && <AddStage />}
    </>
  )
}

const Experiments: React.FC = () => {
  const { cliError, hasData } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  if (cliError) {
    return (
      <WebviewWrapper className={styles.experiments}>
        <ErrorState cliError={cliError} />
      </WebviewWrapper>
    )
  }

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
