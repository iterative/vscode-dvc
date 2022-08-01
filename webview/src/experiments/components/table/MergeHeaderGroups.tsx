import React from 'react'
import cx from 'classnames'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import { TableHeader } from './TableHeader'
import styles from './styles.module.scss'
import { DragFunction } from '../../../shared/components/dragDrop/Draggable'

export const MergedHeaderGroups: React.FC<{
  headerGroup: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  orderedColumns: Column[]
  onDragUpdate: DragFunction
  onDragStart: DragFunction
  onDragEnd: DragFunction
  firstExpColumnCellId: string
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({
  headerGroup,
  columns,
  orderedColumns,
  onDragUpdate,
  onDragEnd,
  onDragStart,
  root,
  firstExpColumnCellId,
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
          firstExpColumnCellId={firstExpColumnCellId}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
          key={column.id}
          orderedColumns={orderedColumns}
          column={column}
          columns={columns}
          onDragEnter={onDragUpdate}
          onDragStart={onDragStart}
          onDrop={onDragEnd}
          root={root}
        />
      ))}
    </div>
  )
}
