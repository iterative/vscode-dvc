import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { HeaderGroup } from 'react-table'
import { TableHeaderCell } from './TableHeaderCell'
import { ExperimentsState } from '../../../store'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'

interface TableHeaderProps {
  column: HeaderGroup<Experiment> & { originalId?: string }
  columns: HeaderGroup<Experiment>[]
  orderedColumns: Column[]
  onDragEnter: DragFunction
  onDragEnd: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  onDragLeave: DragFunction
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  column,
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
  const { filters } = useSelector((state: ExperimentsState) => state.tableData)

  const hasFilter = !!(column.id && filters.includes(column.id))

  return (
    <TableHeaderCell
      column={column}
      columns={columns}
      orderedColumns={orderedColumns}
      hasFilter={hasFilter}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      root={root}
      setExpColumnNeedsShadow={setExpColumnNeedsShadow}
    />
  )
}
