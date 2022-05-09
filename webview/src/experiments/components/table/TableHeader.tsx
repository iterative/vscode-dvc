import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import {
  Experiment,
  Column,
  ColumnType
} from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup } from 'react-table'
import cx from 'classnames'
import {
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot
} from 'react-beautiful-dnd'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { SortOrder, SortPicker } from './SortPicker'
import { countUpperLevels, isFirstLevelHeader } from '../../util/columns'
import { sendMessage } from '../../../shared/vscode'
import { ContextMenu } from '../../../shared/components/contextMenu/ContextMenu'

export const ColumnDragHandle: React.FC<{
  column?: HeaderGroup<Experiment>
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
}> = ({ provided, snapshot, column }) => {
  return (
    <span
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      data-testid="rendered-header"
      style={provided.draggableProps.style}
      className={cx(styles.cellContents, {
        [styles.draggingColumn]: snapshot.isDragging,
        [styles.staticColumn]: !snapshot.isDragging,
        [styles.isDroppedColumn]: snapshot.isDropAnimating
      })}
      onKeyDown={e => {
        e.stopPropagation()
      }}
      role={'columnheader'}
      tabIndex={0}
    >
      {column?.render('Header')}
    </span>
  )
}

const TableHeaderCell: React.FC<{
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  orderedColumns: Column[]
  index: number
  sortOrder: SortOrder
  menuDisabled: boolean
  menuContent: React.ReactNode
}> = ({
  column,
  columns,
  orderedColumns,
  index,
  sortOrder,
  menuContent,
  menuDisabled
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
        <Draggable
          key={column.id}
          draggableId={column.id}
          index={index}
          isDragDisabled={!isDraggable}
        >
          {(provided, snapshot) => (
            <ColumnDragHandle
              column={column}
              provided={provided}
              snapshot={snapshot}
            />
          )}
        </Draggable>
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
  index: number
  orderedColumns: Column[]
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  sorts,
  index,
  orderedColumns
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

  return (
    <TableHeaderCell
      column={column}
      columns={columns}
      orderedColumns={orderedColumns}
      index={index}
      sortOrder={sortOrder}
      menuDisabled={!isSortable}
      menuContent={
        <SortPicker
          sortOrder={sortOrder}
          setSelectedOrder={order => {
            setColumnSort(order)
          }}
        />
      }
    />
  )
}
