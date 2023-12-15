import React, { useEffect } from 'react'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { Header } from '@tanstack/react-table'
import { ColumnResizer, ResizerHeight } from './ColumnResizer'
import { SortOrder } from './util'
import { ColumnDragHandle } from './ColumnDragHandle'
import styles from '../styles.module.scss'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'
import { IconMenu } from '../../../../shared/components/iconMenu/IconMenu'
import { ArrowDown, ArrowUp, Filter } from '../../../../shared/components/icons'

const getIconMenuItems = (
  sortEnabled: boolean,
  sortOrder: SortOrder,
  hasFilter: boolean
) => [
  {
    hidden: !sortEnabled || sortOrder === SortOrder.NONE,
    icon: (sortOrder === SortOrder.DESCENDING && ArrowDown) || ArrowUp,
    tooltip: 'Table Sorted By'
  },
  {
    hidden: !hasFilter,
    icon: Filter,
    tooltip: 'Table Filtered By'
  }
]

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
  const isTimestamp = header.id === 'Created'
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
