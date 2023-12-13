import React from 'react'
import cx from 'classnames'
import { flexRender, Header } from '@tanstack/react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import styles from '../styles.module.scss'
import {
  DragFunction,
  Draggable
} from '../../../../shared/components/dragDrop/Draggable'

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
