import {
  Experiment,
  Column,
  ColumnType
} from 'dvc/src/experiments/webview/contract'
import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { HeaderGroup } from 'react-table'
import cx from 'classnames'
import { useInView } from 'react-intersection-observer'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import {
  changeFocusedColumnIds,
  initialBorderIds,
  changeIsColumnResizing
} from './focusedColumnSlice'
import { countUpperLevels, isFirstLevelHeader } from '../../util/columns'
import { ContextMenu } from '../../../shared/components/contextMenu/ContextMenu'
import { ExperimentsState } from '../../store'
import {
  Draggable,
  DragFunction
} from '../../../shared/components/dragDrop/Draggable'
import { MessagesMenu } from '../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../shared/components/messagesMenu/MessagesMenuOption'
import { IconMenu } from '../../../shared/components/iconMenu/IconMenu'
import { DownArrow, Lines, UpArrow } from '../../../shared/components/icons'
import { getFirstColumnId, getLastColumnId } from '../../util/headerCell'

export enum SortOrder {
  ASCENDING = 'Sort Ascending',
  DESCENDING = 'Sort Descending',
  NONE = 'Remove Sort'
}

const possibleOrders = {
  false: SortOrder.ASCENDING,
  true: SortOrder.DESCENDING,
  undefined: SortOrder.NONE
} as const

export const ColumnDragHandle: React.FC<{
  disabled: boolean
  column: HeaderGroup<Experiment>
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
}> = ({ disabled, column, onDragEnter, onDragStart, onDrop }) => {
  const DropTarget = <span>{column?.name}</span>

  return (
    <span
      data-testid="rendered-header"
      className={cx(styles.cellContents)}
      onKeyDown={e => {
        e.stopPropagation()
      }}
      role={'columnheader'}
      tabIndex={0}
    >
      <Draggable
        id={column.id}
        disabled={disabled}
        group={'experiment-table'}
        dropTarget={DropTarget}
        onDragEnter={onDragEnter}
        onDragStart={onDragStart}
        onDrop={onDrop}
      >
        <span>{column?.render('Header')}</span>
      </Draggable>
    </span>
  )
}

const calcResizerHeight = (
  isPlaceholder: boolean,
  orderedColumns: Column[],
  column: HeaderGroup<Experiment>,
  columns: HeaderGroup<Experiment>[]
) => {
  const nbUpperLevels = isPlaceholder
    ? 0
    : countUpperLevels(orderedColumns, column, columns, 0)
  return 100 + nbUpperLevels * 92 + '%'
}

const getHeaderPropsArgs = (
  column: HeaderGroup<Experiment>,
  sortEnabled: boolean,
  sortOrder: SortOrder
) => {
  return {
    className: cx(
      styles.th,
      column.placeholderOf ? styles.placeholderHeaderCell : styles.headerCell,
      {
        [styles.paramHeaderCell]: column.group === ColumnType.PARAMS,
        [styles.metricHeaderCell]: column.group === ColumnType.METRICS,
        [styles.depHeaderCell]: column.group === ColumnType.DEPS,
        [styles.firstLevelHeader]: isFirstLevelHeader(column.id),
        [styles.leafHeader]: column.headers === undefined,
        [styles.menuEnabled]: sortEnabled,
        [styles.sortingHeaderCellAsc]:
          sortOrder === SortOrder.ASCENDING && !column.parent?.placeholderOf,
        [styles.sortingHeaderCellDesc]:
          sortOrder === SortOrder.DESCENDING && !column.placeholderOf
      }
    ),
    style: {
      position: undefined
    }
  }
}

const getIconMenuItems = (
  sortEnabled: boolean,
  sortOrder: SortOrder,
  hasFilter: boolean
) => [
  {
    hidden: !sortEnabled || sortOrder === SortOrder.NONE,
    icon: (sortOrder === SortOrder.DESCENDING && DownArrow) || UpArrow,
    tooltip: 'Table Sorted By'
  },
  {
    hidden: !hasFilter,
    icon: Lines,
    tooltip: 'Table Filtered By'
  }
]

const WithExpColumnNeedsShadowUpdates: React.FC<{
  children: React.ReactNode
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({ root, setExpColumnNeedsShadow, children }) => {
  const [ref, needsShadow] = useInView({
    root,
    rootMargin: '0px 0px 0px -15px',
    threshold: 1
  })

  useEffect(() => {
    setExpColumnNeedsShadow(needsShadow)
  }, [needsShadow, setExpColumnNeedsShadow])

  return <div ref={ref}>{children}</div>
}

const TableHeaderCellContents: React.FC<{
  column: HeaderGroup<Experiment>
  sortOrder: SortOrder
  sortEnabled: boolean
  hasFilter: boolean
  isDraggable: boolean
  menuSuppressed: boolean
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  canResize: boolean
  setMenuSuppressed: (menuSuppressed: boolean) => void
  resizerHeight: string
}> = ({
  column,
  sortEnabled,
  sortOrder,
  hasFilter,
  isDraggable,
  menuSuppressed,
  onDragEnter,
  onDragStart,
  onDrop,
  canResize,
  setMenuSuppressed,
  resizerHeight
}) => {
  const dispatch = useDispatch()
  return (
    <>
      <div className={styles.iconMenu}>
        <IconMenu items={getIconMenuItems(sortEnabled, sortOrder, hasFilter)} />
      </div>
      <ColumnDragHandle
        column={column}
        disabled={!isDraggable || menuSuppressed}
        onDragEnter={onDragEnter}
        onDragStart={onDragStart}
        onDrop={onDrop}
      />
      {canResize && (
        <button
          {...column.getResizerProps()}
          // the mousedowncapture event is used instead of mousedown since
          // .getResizerProps() adds a mousedown handler
          onMouseDownCapture={() => {
            dispatch(changeIsColumnResizing(true))
          }}
          onMouseUp={() => dispatch(changeIsColumnResizing(false))}
          onMouseEnter={() => {
            setMenuSuppressed(true)
          }}
          onMouseLeave={() => setMenuSuppressed(false)}
          className={styles.columnResizer}
          style={{ height: resizerHeight }}
        />
      )}
    </>
  )
}

const TableHeaderCell: React.FC<{
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  hasFilter: boolean
  orderedColumns: Column[]
  sortOrder: SortOrder
  sortEnabled: boolean
  menuDisabled?: boolean
  menuContent?: React.ReactNode
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  firstExpColumnCellId: string
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({
  column,
  columns,
  orderedColumns,
  hasFilter,
  sortOrder,
  sortEnabled,
  menuContent,
  menuDisabled,
  onDragEnter,
  onDragStart,
  onDrop,
  root,
  firstExpColumnCellId,
  setExpColumnNeedsShadow
}) => {
  const [menuSuppressed, setMenuSuppressed] = React.useState<boolean>(false)
  const dispatch = useDispatch()
  const isDraggable =
    !column.placeholderOf && !['id', 'timestamp'].includes(column.id)

  const isPlaceholder = !!column.placeholderOf
  const canResize = column.canResize && !isPlaceholder
  const resizerHeight = calcResizerHeight(
    isPlaceholder,
    orderedColumns,
    column,
    columns
  )

  const cellContents = (
    <TableHeaderCellContents
      column={column}
      sortOrder={sortOrder}
      sortEnabled={sortEnabled}
      hasFilter={hasFilter}
      isDraggable={isDraggable}
      menuSuppressed={menuSuppressed}
      onDragEnter={onDragEnter}
      onDragStart={onDragStart}
      onDrop={onDrop}
      canResize={canResize}
      setMenuSuppressed={setMenuSuppressed}
      resizerHeight={resizerHeight}
    />
  )

  return (
    <ContextMenu
      content={menuContent}
      disabled={menuDisabled || menuSuppressed}
      trigger={'contextmenu click'}
    >
      <div
        {...column.getHeaderProps(
          getHeaderPropsArgs(column, sortEnabled, sortOrder)
        )}
        data-testid={`header-${column.id}`}
        key={column.id}
        role="columnheader"
        tabIndex={0}
        onMouseEnter={() => {
          dispatch(
            changeFocusedColumnIds({
              leftColumnBorderId: getFirstColumnId(column),
              rightColumnBorderId: getLastColumnId(column)
            })
          )
        }}
        onMouseLeave={() => dispatch(changeFocusedColumnIds(initialBorderIds))}
      >
        {firstExpColumnCellId === column.id ? (
          <WithExpColumnNeedsShadowUpdates
            setExpColumnNeedsShadow={setExpColumnNeedsShadow}
            root={root}
          >
            {cellContents}
          </WithExpColumnNeedsShadowUpdates>
        ) : (
          cellContents
        )}
      </div>
    </ContextMenu>
  )
}

interface TableHeaderProps {
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  orderedColumns: Column[]
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  firstExpColumnCellId: string
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  orderedColumns,
  onDragEnter,
  onDragStart,
  onDrop,
  root,
  firstExpColumnCellId,
  setExpColumnNeedsShadow
}) => {
  const { filters, sorts } = useSelector(
    (state: ExperimentsState) => state.tableData
  )
  const baseColumn = column.placeholderOf || column
  const sort = sorts.find(sort => sort.path === baseColumn.id)

  const hasFilter = !!(column.id && filters.includes(column.id))
  const isSortable =
    !column.placeholderOf &&
    !['id', 'timestamp'].includes(column.id) &&
    !column.columns

  const sortOrder: SortOrder = possibleOrders[`${sort?.descending}`]

  const contextMenuOptions: MessagesMenuOptionProps[] = React.useMemo(() => {
    const menuOptions: MessagesMenuOptionProps[] = [
      {
        hidden: !!column.headers,
        id: 'hide-column',
        label: 'Hide Column',
        message: {
          payload: column.id,
          type: MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN
        }
      },
      {
        hidden: column.group !== ColumnType.PARAMS,
        id: 'open-to-the-side',
        label: 'Open to the Side',
        message: {
          payload: column.id,
          type: MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE
        }
      }
    ]

    return menuOptions
  }, [column])

  return (
    <TableHeaderCell
      column={column}
      columns={columns}
      orderedColumns={orderedColumns}
      sortOrder={sortOrder}
      sortEnabled={isSortable}
      hasFilter={hasFilter}
      onDragEnter={onDragEnter}
      onDragStart={onDragStart}
      onDrop={onDrop}
      menuDisabled={!isSortable && column.group !== ColumnType.PARAMS}
      root={root}
      firstExpColumnCellId={firstExpColumnCellId}
      setExpColumnNeedsShadow={setExpColumnNeedsShadow}
      menuContent={
        <div>
          <MessagesMenu options={contextMenuOptions} />
          <VSCodeDivider />
          <MessagesMenu
            options={[
              {
                hidden: sortOrder === SortOrder.ASCENDING,
                id: SortOrder.ASCENDING,
                label: SortOrder.ASCENDING,
                message: {
                  payload: {
                    descending: false,
                    path: column.id
                  },
                  type: MessageFromWebviewType.SORT_COLUMN
                }
              },
              {
                hidden: sortOrder === SortOrder.DESCENDING,
                id: SortOrder.DESCENDING,
                label: SortOrder.DESCENDING,
                message: {
                  payload: {
                    descending: true,
                    path: column.id
                  },
                  type: MessageFromWebviewType.SORT_COLUMN
                }
              },
              {
                hidden: sortOrder === SortOrder.NONE,
                id: SortOrder.NONE,
                label: SortOrder.NONE,
                message: {
                  payload: column.id,
                  type: MessageFromWebviewType.REMOVE_COLUMN_SORT
                }
              }
            ]}
          />
        </div>
      }
    />
  )
}
