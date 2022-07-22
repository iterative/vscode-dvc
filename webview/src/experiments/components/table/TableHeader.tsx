import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import {
  Experiment,
  Column,
  ColumnType
} from 'dvc/src/experiments/webview/contract'
import React, { useEffect } from 'react'
import { HeaderGroup } from 'react-table'
import cx from 'classnames'
import { useInView } from 'react-intersection-observer'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { countUpperLevels, isFirstLevelHeader } from '../../util/columns'
import { ContextMenu } from '../../../shared/components/contextMenu/ContextMenu'
import {
  Draggable,
  OnDragOver,
  OnDragStart,
  OnDrop
} from '../../../shared/components/dragDrop/DragDropWorkbench'
import { MessagesMenu } from '../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../shared/components/messagesMenu/MessagesMenuOption'
import { IconMenu } from '../../../shared/components/iconMenu/IconMenu'
import { DownArrow, Lines, UpArrow } from '../../../shared/components/icons'

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
  onDragOver: OnDragOver
  onDragStart: OnDragStart
  onDrop: OnDrop
}> = ({ disabled, column, onDragOver, onDragStart, onDrop }) => {
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
        dropTarget={{
          element: DropTarget,
          wrapperTag: 'div'
        }}
        onDragOver={onDragOver}
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
  onDragOver: OnDragOver
  onDragStart: OnDragStart
  onDrop: OnDrop
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
  onDragOver,
  onDragStart,
  onDrop,
  canResize,
  setMenuSuppressed,
  resizerHeight
}) => {
  return (
    <>
      <div className={styles.iconMenu}>
        <IconMenu items={getIconMenuItems(sortEnabled, sortOrder, hasFilter)} />
      </div>
      <ColumnDragHandle
        column={column}
        disabled={!isDraggable || menuSuppressed}
        onDragOver={onDragOver}
        onDragStart={onDragStart}
        onDrop={onDrop}
      />
      {canResize && (
        <div
          {...column.getResizerProps()}
          onMouseEnter={() => setMenuSuppressed(true)}
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
  onDragOver: OnDragOver
  onDragStart: OnDragStart
  onDrop: OnDrop
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
  onDragOver,
  onDragStart,
  onDrop,
  root,
  firstExpColumnCellId,
  setExpColumnNeedsShadow
}) => {
  const [menuSuppressed, setMenuSuppressed] = React.useState<boolean>(false)
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
      onDragOver={onDragOver}
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
  sorts: SortDefinition[]
  filters: string[]
  orderedColumns: Column[]
  onDragOver: OnDragOver
  onDragStart: OnDragStart
  onDrop: OnDrop
  firstExpColumnCellId: string
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  filters,
  sorts,
  orderedColumns,
  onDragOver,
  onDragStart,
  onDrop,
  root,
  firstExpColumnCellId,
  setExpColumnNeedsShadow
}) => {
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
      onDragOver={onDragOver}
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
