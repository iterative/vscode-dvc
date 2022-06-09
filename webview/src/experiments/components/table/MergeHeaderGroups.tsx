import React from 'react'
import cx from 'classnames'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import { TableHeader } from './TableHeader'
import styles from './styles.module.scss'
import {
  OnDragOver,
  OnDragStart,
  OnDrop
} from '../../../shared/components/dragDrop/DragDropWorkbench'

export const MergedHeaderGroups: React.FC<{
  headerGroup: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  sorts: SortDefinition[]
  orderedColumns: Column[]
  onDragUpdate: OnDragOver
  onDragStart: OnDragStart
  onDragEnd: OnDrop
}> = ({
  headerGroup,
  sorts,
  columns,
  orderedColumns,
  onDragUpdate,
  onDragEnd,
  onDragStart
}) => {
  return (
    <div
      {...headerGroup.getHeaderGroupProps({
        className: cx(styles.tr, styles.headerRow)
      })}
    >
      {headerGroup.headers.map((column: HeaderGroup<Experiment>) => (
        <TableHeader
          key={column.id}
          orderedColumns={orderedColumns}
          column={column}
          columns={columns}
          sorts={sorts}
          onDragOver={onDragUpdate}
          onDragStart={onDragStart}
          onDrop={onDragEnd}
        />
      ))}
    </div>
  )
}
