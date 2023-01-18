import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { Header } from '@tanstack/react-table'
import { TableHeaderCell } from './TableHeaderCell'
import { ExperimentsState } from '../../../store'
import { DragFunction } from '../../../../shared/components/dragDrop/Draggable'

interface TableHeaderProps {
  header: Header<Experiment, unknown>
  onDragEnter: DragFunction
  onDragEnd: DragFunction
  onDragStart: DragFunction
  onDrop: DragFunction
  onDragLeave: DragFunction
  setExpColumnNeedsShadow: (needsShadow: boolean) => void
  root: HTMLElement | null
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  header,
  onDragEnter,
  onDragEnd,
  onDragStart,
  onDrop,
  onDragLeave,
  root,
  setExpColumnNeedsShadow
}) => {
  const { filters } = useSelector((state: ExperimentsState) => state.tableData)

  const hasFilter = !!(header.id && filters.includes(header.id))

  return (
    <TableHeaderCell
      header={header}
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
