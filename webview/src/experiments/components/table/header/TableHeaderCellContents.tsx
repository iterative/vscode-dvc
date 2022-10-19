import React, { useState, useEffect } from 'react'
import cx from 'classnames'
import { ColumnType, Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import { SortOrder } from './TableHeader'
import styles from '../styles.module.scss'
import {
  Draggable,
  DragFunction
} from '../../../../shared/components/dragDrop/Draggable'
import { IconMenu } from '../../../../shared/components/iconMenu/IconMenu'
import { DownArrow, Lines, UpArrow } from '../../../../shared/components/icons'

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

export const ColumnDragHandle: React.FC<{
  disabled: boolean
  column: HeaderGroup<Experiment>
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  onDragEnd: DragFunction
}> = ({ disabled, column, onDragEnter, onDragStart, onDragEnd, onDrop }) => {
  const DropTarget = <span>{column?.name}</span>

  return (
    <span
      data-testid="rendered-header"
      className={cx(styles.cellContents)}
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
        onDragEnd={onDragEnd}
        onDrop={onDrop}
      >
        <span>{column?.render('Header')}</span>
      </Draggable>
    </span>
  )
}

export const TableHeaderCellContents: React.FC<{
  column: HeaderGroup<Experiment>
  sortOrder: SortOrder
  sortEnabled: boolean
  hasFilter: boolean
  isDraggable: boolean
  menuSuppressed: boolean
  onDragEnter: DragFunction
  onDragEnd: DragFunction
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
  onDragEnd,
  onDragStart,
  onDrop,
  canResize,
  setMenuSuppressed,
  resizerHeight
}) => {
  const [isResizing, setIsResizing] = useState(false)
  const isTimestamp = column.group === ColumnType.TIMESTAMP

  useEffect(() => {
    setIsResizing(column.isResizing)
  }, [column.isResizing])

  return (
    <>
      <div
        className={cx(styles.iconMenu, { [styles.moveToRight]: isTimestamp })}
      >
        <IconMenu items={getIconMenuItems(sortEnabled, sortOrder, hasFilter)} />
      </div>
      <ColumnDragHandle
        column={column}
        disabled={!isDraggable || menuSuppressed}
        onDragEnter={onDragEnter}
        onDragStart={onDragStart}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      />
      {canResize && (
        <div
          {...column.getResizerProps()}
          onMouseEnter={() => setMenuSuppressed(true)}
          onMouseLeave={() => setMenuSuppressed(false)}
          className={cx(styles.columnResizer, isResizing && styles.isResizing)}
          style={{ height: resizerHeight }}
        />
      )}
    </>
  )
}
