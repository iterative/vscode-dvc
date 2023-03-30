import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useSelector } from 'react-redux'
import {
  Column,
  Commit,
  ColumnType,
  Experiment
} from 'dvc/src/experiments/webview/contract'
import {
  ColumnDef,
  CellContext,
  useReactTable,
  Row as TableRow,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnSizingState
} from '@tanstack/react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { Table } from './table/Table'
import styles from './table/styles.module.scss'
import { AddColumns, Welcome } from './GetStarted'
import { RowSelectionProvider } from './table/RowSelectionContext'
import { CellValue } from './table/content/Cell'
import { CellSecondaryName } from './table/CellSecondaryName'
import { AddStage } from './AddStage'
import { buildColumns, columnHelper } from '../util/buildColumns'
import { sendMessage } from '../../shared/vscode'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { GetStarted } from '../../shared/components/getStarted/GetStarted'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { ExperimentsState } from '../store'
import { EXPERIMENT_COLUMN_ID } from '../util/columns'

const DEFAULT_COLUMN_WIDTH = 90
const MINIMUM_COLUMN_WIDTH = 90

const ExperimentHeader = () => (
  <div className={styles.experimentHeader}>Experiment</div>
)

const getDefaultColumnWithIndicatorsPlaceHolder = () =>
  columnHelper.accessor(() => EXPERIMENT_COLUMN_ID, {
    cell: (cell: CellContext<Column, CellValue>) => {
      const {
        row: {
          original: { label, displayNameOrParent, commit, sha }
        }
      } = cell as unknown as CellContext<Experiment, CellValue>
      return (
        <div className={styles.experimentCellContents}>
          <span>{label}</span>
          {displayNameOrParent && (
            <CellSecondaryName
              sha={sha}
              displayNameOrParent={displayNameOrParent}
              commit={commit}
            />
          )}
        </div>
      )
    },
    header: ExperimentHeader,
    id: EXPERIMENT_COLUMN_ID,
    minSize: 215,
    size: 215
  })

const getColumns = (columns: Column[]) => {
  const includeTimestamp = columns.some(
    ({ type }) => type === ColumnType.TIMESTAMP
  )

  const timestampColumn =
    (includeTimestamp &&
      buildColumns(
        [
          {
            hasChildren: false,
            label: 'Created',
            parentPath: ColumnType.TIMESTAMP,
            path: 'Created',
            type: ColumnType.TIMESTAMP,
            width: 100
          }
        ],
        ColumnType.TIMESTAMP
      )) ||
    []

  return [
    getDefaultColumnWithIndicatorsPlaceHolder(),
    ...timestampColumn,
    ...buildColumns(columns, ColumnType.METRICS),
    ...buildColumns(columns, ColumnType.PARAMS),
    ...buildColumns(columns, ColumnType.DEPS)
  ]
}

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
        sendMessage({
          payload: { id, width },
          type: MessageFromWebviewType.RESIZE_COLUMN
        })
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
    columns: columnsData,
    columnOrder: initialColumnOrder,
    columnWidths,
    hasColumns,
    hasConfig,
    hasValidDvcYaml,
    rows: data
  } = useSelector((state: ExperimentsState) => state.tableData)

  const [expanded, setExpanded] = useState({})

  const [columns, setColumns] = useState(getColumns(columnsData))
  const [columnSizing, setColumnSizing] =
    useState<ColumnSizingState>(columnWidths)
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder)
  const resizeTimeout = useRef(0)

  useEffect(() => {
    reportResizedColumn(columnSizing, columnWidths, resizeTimeout)
  }, [columnSizing, columnWidths])

  useEffect(() => {
    setColumns(getColumns(columnsData))
  }, [columnsData])

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
      <Table instance={instance} onColumnOrderChange={setColumnOrder} />
      {!hasConfig && <AddStage hasValidDvcYaml={hasValidDvcYaml} />}
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
