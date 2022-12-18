import React from 'react'
import cx from 'classnames'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import { TableHeader } from './TableHeader'
import styles from '../styles.module.scss'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'

export const MergedHeaderGroups: React.FC<{
  headerGroup: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  orderedColumns: Column[]
  onDragEnter: DragFunction
  onDragStart: DragFunction
  onDragEnd: DragFunction
  onDrop: DragFunction
  onDragLeave: DragFunction
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({
  headerGroup,
  columns,
  orderedColumns,
  onDragEnter,
  onDragEnd,
  onDragStart,
  onDrop,
  onDragLeave,
  root,
  setExpColumnNeedsShadow
}) => {
  return (
    <div
      {...headerGroup.getHeaderGroupProps({
        className: cx(styles.tr, styles.headRow)
      })}
    >
      {headerGroup.headers.map((column: HeaderGroup<Experiment>) => (
        <TableHeader
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
          key={column.id}
          orderedColumns={orderedColumns}
          column={column}
          columns={columns}
          onDragEnter={onDragEnter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
          onDragLeave={onDragLeave}
          root={root}
        />
      ))}
    </div>
  )
}
