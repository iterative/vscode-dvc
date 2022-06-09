import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import {
  Experiment,
  Column,
  ColumnType
} from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup } from 'react-table'
import cx from 'classnames'
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
import { AllIcons } from '../../../shared/components/Icon'

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
    )
  }
}

const getIconMenuItems = (
  sortEnabled: boolean,
  sortOrder: SortOrder,
  hasFilter: boolean
) => [
  {
    hidden: !sortEnabled || sortOrder === SortOrder.NONE,
    icon:
      (sortOrder === SortOrder.DESCENDING && AllIcons.DOWN_ARROW) ||
      AllIcons.UP_ARROW,
    tooltip: 'Table Sorted By'
  },
  {
    hidden: !hasFilter,
    icon: AllIcons.LINES,
    tooltip: 'Table Filtered By'
  }
]

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
  onDrop
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

  return (
    <ContextMenu
      content={menuContent}
      disabled={menuDisabled || menuSuppressed}
    >
      <div
        {...column.getHeaderProps(
          getHeaderPropsArgs(column, sortEnabled, sortOrder)
        )}
        key={column.id}
        data-testid={`header-${column.id}`}
        role={'columnheader'}
        tabIndex={0}
      >
        <div className={styles.iconMenu}>
          <IconMenu
            items={getIconMenuItems(sortEnabled, sortOrder, hasFilter)}
          />
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
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  filters,
  sorts,
  orderedColumns,
  onDragOver,
  onDragStart,
  onDrop
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
