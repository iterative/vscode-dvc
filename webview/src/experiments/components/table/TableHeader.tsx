import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import {
  Experiment,
  MetricOrParam,
  MetricOrParamType
} from 'dvc/src/experiments/webview/contract'
import React, { useState } from 'react'
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

const ColumnDragHandle: React.FC<{
  column: HeaderGroup<Experiment>
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
  onClick: () => void
}> = ({ provided, snapshot, column, onClick }) => {
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
      onClick={onClick}
      onKeyDown={e => {
        e.stopPropagation()
      }}
      role={'columnheader'}
      tabIndex={0}
    >
      {column.render('Header')}
    </span>
  )
}

const TableHeaderCell: React.FC<{
  column: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  orderedColumns: MetricOrParam[]
  sortOrder: SortOrder
  provided: DraggableProvided
  snapshot: DraggableStateSnapshot
  menuDisabled: boolean
  menuVisible: boolean
  menuContent: React.ReactNode
  onMenuBlur: () => void
  onClick: () => void
}> = ({
  column,
  columns,
  orderedColumns,
  sortOrder,
  provided,
  snapshot,
  menuDisabled,
  menuVisible,
  menuContent,
  onMenuBlur,
  onClick
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
          [styles.paramHeaderCell]: column.group === MetricOrParamType.PARAMS,
          [styles.metricHeaderCell]: column.group === MetricOrParamType.METRICS,
          [styles.firstLevelHeader]: isFirstLevelHeader(column.id),
          ...sortingClasses()
        }
      )
    }
  }

  return (
    <ContextMenu
      disabled={menuDisabled}
      content={menuContent}
      open={menuVisible}
      onClickOutside={onMenuBlur}
    >
      <div
        {...column.getHeaderProps(headerPropsArgs())}
        key={column.id}
        data-testid={`header-${column.id}`}
      >
        <ColumnDragHandle
          column={column}
          provided={provided}
          snapshot={snapshot}
          onClick={onClick}
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
  index: number
  orderedColumns: MetricOrParam[]
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  columns,
  sorts,
  index,
  orderedColumns
}) => {
  const [sortMenuVisible, setSortMenuVisible] = useState(false)

  const baseColumn = column.placeholderOf || column
  const sort = sorts.find(sort => sort.path === baseColumn.id)
  const isDraggable =
    !column.placeholderOf &&
    !['id', 'timestamp'].includes(column.id) &&
    !column.columns
  const isSortable = isDraggable

  const showSortMenu = () => setSortMenuVisible(isSortable)
  const hideSortMenu = () => setSortMenuVisible(false)

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
      type: MessageFromWebviewType.COLUMN_SORT_REMOVED
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
      type: MessageFromWebviewType.COLUMN_SORTED
    })
  }

  return (
    <Draggable
      key={column.id}
      draggableId={column.id}
      index={index}
      isDragDisabled={!isDraggable}
    >
      {(provided, snapshot) => (
        <TableHeaderCell
          column={column}
          columns={columns}
          orderedColumns={orderedColumns}
          sortOrder={sortOrder}
          provided={provided}
          snapshot={snapshot}
          menuDisabled={!isSortable}
          menuVisible={sortMenuVisible}
          onMenuBlur={hideSortMenu}
          onClick={() => {
            if (!snapshot.isDragging) {
              showSortMenu()
            }
          }}
          menuContent={
            <SortPicker
              sortOrder={sortOrder}
              setSelectedOrder={order => {
                setColumnSort(order)
                hideSortMenu()
              }}
            />
          }
        />
      )}
    </Draggable>
  )
}
