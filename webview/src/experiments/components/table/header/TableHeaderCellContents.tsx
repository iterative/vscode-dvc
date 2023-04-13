import React, { useEffect } from 'react'
import cx from 'classnames'
import { ColumnType, Experiment } from 'dvc/src/experiments/webview/contract'
import { flexRender, Header } from '@tanstack/react-table'
import { SortOrder } from './ContextMenuContent'
import { ColumnResizer, ResizerHeight } from './ColumnResizer'
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
  header: Header<Experiment, unknown>
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  onDragEnd: DragFunction
  onDragLeave: DragFunction
}> = ({
  disabled,
  header,
  onDragEnter,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragLeave
}) => {
  return (
    <span
      data-testid="rendered-header"
      className={cx(styles.cellContents)}
      style={{
        width: header.getSize()
      }}
    >
      <Draggable
        id={header.id}
        disabled={disabled}
        onDragEnter={onDragEnter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
        onDragLeave={onDragLeave}
      >
        <span className={header.isPlaceholder ? '' : styles.cellDraggable}>
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
      </Draggable>
    </span>
  )
}

export const TableHeaderCellContents: React.FC<{
  header: Header<Experiment, unknown>
  sortOrder: SortOrder
  sortEnabled: boolean
  hasFilter: boolean
  isDraggable: boolean
  menuSuppressed: boolean
  onDragEnter: DragFunction
  onDragEnd: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  onDragLeave: DragFunction
  canResize: boolean
  setMenuSuppressed: (menuSuppressed: boolean) => void
  resizerHeight: ResizerHeight
}> = ({
  header,
  sortEnabled,
  sortOrder,
  hasFilter,
  isDraggable,
  menuSuppressed,
  onDragEnter,
  onDragEnd,
  onDragStart,
  onDrop,
  onDragLeave,
  canResize,
  setMenuSuppressed,
  resizerHeight
}) => {
  const isTimestamp = header.headerGroup.id === ColumnType.TIMESTAMP
  const columnIsResizing = header.column.getIsResizing()

  useEffect(() => {
    if (columnIsResizing) {
      document.body.classList.add(styles.isColumnResizing)
    } else {
      document.body.classList.remove(styles.isColumnResizing)
    }
  }, [columnIsResizing])

  return (
    <>
      <div
        className={cx(styles.iconMenu, { [styles.moveToRight]: isTimestamp })}
      >
        <IconMenu
          items={getIconMenuItems(
            sortEnabled && !header.isPlaceholder,
            sortOrder,
            hasFilter
          )}
        />
      </div>
      <ColumnDragHandle
        header={header}
        disabled={!isDraggable || menuSuppressed}
        onDragEnter={onDragEnter}
        onDragStart={onDragStart}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onDragLeave={onDragLeave}
      />
      {canResize && (
        <ColumnResizer
          setMenuSuppressed={setMenuSuppressed}
          resizerHeight={resizerHeight}
          header={header}
          columnIsResizing={columnIsResizing}
        />
      )}
    </>
  )
}
