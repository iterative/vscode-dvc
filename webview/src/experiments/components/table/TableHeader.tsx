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
import { SortOrder, SortPicker } from './SortPicker'
import { countUpperLevels, isFirstLevelHeader } from '../../util/columns'
import { sendMessage } from '../../../shared/vscode'
import { ContextMenu } from '../../../shared/components/contextMenu/ContextMenu'
import {
  Draggable,
  OnDragOver,
  OnDragStart,
  OnDrop
} from '../../../shared/components/dragDrop/DragDropWorkbench'
import { MessagesMenu } from '../../../shared/components/messagesMenu/MessagesMenu'
import { MessagesMenuOptionProps } from '../../../shared/components/messagesMenu/MessagesMenuOption'

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
  orderedColumns: Column[]
  sortOrder: SortOrder
  menuDisabled: boolean
  menuContent: React.ReactNode
  onDragOver: OnDragOver
  onDragStart: OnDragStart
  onDrop: OnDrop
}> = ({
  column,
  columns,
  orderedColumns,
  sortOrder,
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
          [styles.firstLevelHeader]: isFirstLevelHeader(column.id),
          ...sortingClasses()
        }
      )
    }
  }
  const isDraggable =
    !column.placeholderOf && !['id', 'timestamp'].includes(column.id)

  return (
    <ContextMenu content={menuContent} disabled={menuDisabled}>
      <div
        {...column.getHeaderProps(headerPropsArgs())}
        key={column.id}
        data-testid={`header-${column.id}`}
      >
        <ColumnDragHandle
          column={column}
          disabled={!isDraggable}
          onDragOver={onDragOver}
          onDragStart={onDragStart}
          onDrop={onDrop}
        />
        {canResize && (
          <div
            {...column.getResizerProps()}
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
  orderedColumns: Column[]
  onDragOver: OnDragOver
  onDragStart: OnDragStart
  onDrop: OnDrop
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  sorts,
  orderedColumns,
  onDragOver,
  onDragStart,
  onDrop
}) => {
  const baseColumn = column.placeholderOf || column
  const sort = sorts.find(sort => sort.path === baseColumn.id)
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

  const removeColumnSort = () => {
    sendMessage({
      payload: column.id,
      type: MessageFromWebviewType.REMOVE_COLUMN_SORT
    })
  }

  const setColumnSort = (selectedSort: SortOrder) => {
    if (selectedSort === SortOrder.NONE) {
      removeColumnSort()
      return
    }

    const payload: SortDefinition = {
      descending: selectedSort === SortOrder.DESCENDING,
      path: column.id
    }

    sendMessage({
      payload,
      type: MessageFromWebviewType.SORT_COLUMN
    })
  }

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
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      menuDisabled={!isSortable && column.group !== ColumnType.PARAMS}
      menuContent={
        <div>
          {isSortable && (
            <div>
              <SortPicker
                sortOrder={sortOrder}
                setSelectedOrder={order => {
                  setColumnSort(order)
                }}
              />
              <VSCodeDivider />
            </div>
          )}
          <MessagesMenu options={contextMenuOptions} />
        </div>
      }
    />
  )
}
