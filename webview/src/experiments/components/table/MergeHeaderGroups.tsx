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
  filters: string[]
  orderedColumns: Column[]
  onDragUpdate: OnDragOver
  onDragStart: OnDragStart
  onDragEnd: OnDrop
  firstExpColumnCellId: string
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}> = ({
  headerGroup,
  sorts,
  filters,
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
          sorts={sorts}
          filters={filters}
          onDragOver={onDragUpdate}
          onDragStart={onDragStart}
          onDrop={onDragEnd}
          root={root}
        />
      ))}
    </div>
  )
}
