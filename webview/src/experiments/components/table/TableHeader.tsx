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
import { FilterDefinition } from 'dvc/src/experiments/model/filterBy'
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
import { IconMenuItemProps } from '../../../shared/components/iconMenu/IconMenuItem'
import { AllIcons } from '../../../shared/components/Icon'

export enum SortOrder {
  ASCENDING = 'ascending',
  DESCENDING = 'descending',
  NONE = 'none'
}

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
  const isPlaceholder = !!column.placeholderOf
  const canResize = column.canResize && !isPlaceholder
  const nbUpperLevels = isPlaceholder
    ? 0
    : countUpperLevels(orderedColumns, column, columns, 0)
  const resizerHeight = 100 + nbUpperLevels * 92 + '%'

  const sortingClasses = () => ({
    [styles.sortingHeaderCellAsc]:
      sortOrder === 'ascending' && !column.parent?.placeholderOf,
    [styles.sortingHeaderCellDesc]:
      sortOrder === 'descending' && !column.placeholderOf
  })

  const headerPropsArgs = () => {
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
          ...sortingClasses()
        }
      )
    }
  }
  const isDraggable =
    !column.placeholderOf && !['id', 'timestamp'].includes(column.id)

  const menuItems: IconMenuItemProps[] = [
    {
      hidden: !sortEnabled || sortOrder === SortOrder.NONE,
      icon:
        (sortOrder === SortOrder.DESCENDING && AllIcons.DOWN_ARROW) ||
        AllIcons.UP_ARROW,
      onClick: () => {},
      tooltip: 'Sorted column'
    },
    {
      hidden: !hasFilter,
      icon: AllIcons.LINES,
      onClick: () => {},
      tooltip: 'Filtered column'
    }
  ]

  const [menuSupressed, setMenuSupressed] = React.useState<boolean>(false)

  return (
    <ContextMenu
      content={menuContent}
      disabled={menuDisabled || menuSupressed}
      onShow={() => {
        return !column.isResizing
      }}
    >
      <div
        {...column.getHeaderProps(headerPropsArgs())}
        key={column.id}
        data-testid={`header-${column.id}`}
        role={'columnheader'}
        tabIndex={0}
      >
        <div className={styles.iconMenu}>
          <IconMenu items={menuItems} />
        </div>
        <ColumnDragHandle
          column={column}
          disabled={!isDraggable || menuSupressed}
          onDragOver={onDragOver}
          onDragStart={onDragStart}
          onDrop={onDrop}
        />
        {canResize && (
          <div
            {...column.getResizerProps()}
            onMouseEnter={() => setMenuSupressed(true)}
            onMouseLeave={() => setMenuSupressed(false)}
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
  filters: FilterDefinition[]
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
  const filter = filters.find(({ path }) => path === column.id)
  const isSortable =
    !column.placeholderOf &&
    !['id', 'timestamp'].includes(column.id) &&
    !column.columns

  const sortOrder: SortOrder = (() => {
    const possibleOrders = {
      false: SortOrder.ASCENDING,
      true: SortOrder.DESCENDING,
      undefined: SortOrder.NONE
    }

    return possibleOrders[`${sort?.descending}`]
  })()

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
      hasFilter={!!filter}
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
                id: SortOrder.ASCENDING,
                label: 'Sort Ascending',
                message: {
                  payload: {
                    descending: false,
                    path: column.id
                  },
                  type: MessageFromWebviewType.SORT_COLUMN
                }
              },
              {
                id: SortOrder.DESCENDING,
                label: 'Sort Descending',
                message: {
                  payload: {
                    descending: true,
                    path: column.id
                  },
                  type: MessageFromWebviewType.SORT_COLUMN
                }
              },
              {
                id: SortOrder.NONE,
                label: 'Remove Sort',
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
