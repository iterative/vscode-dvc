import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import React, { useRef } from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { DragUpdate } from 'react-beautiful-dnd'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { MergedHeaderGroup } from './MergeHeaderGroups'
import { useColumnOrder } from '../../hooks/useColumnOrder'
import { sendMessage } from '../../../shared/vscode'

interface TableHeadProps {
  instance: TableInstance<Experiment>
  columns: Column[]
  sorts: SortDefinition[]
}

export const TableHead: React.FC<TableHeadProps> = ({
  instance: {
    headerGroups,
    setColumnOrder,
    state: { columnOrder },
    allColumns
  },
  columns,
  sorts
}) => {
  const orderedColumns = useColumnOrder(columns, columnOrder)
  const allHeaders: HeaderGroup<Experiment>[] = []
  for (const headerGroup of headerGroups) {
    allHeaders.push(...headerGroup.headers)
  }

  const fullColumnOrder = useRef<string[]>()

  const onDragStart = () => {
    fullColumnOrder.current = allColumns.map(column => column.id)
  }

  const onDragUpdate = (column: DragUpdate) => {
    if (!column.destination) {
      return
    }
    const { draggableId, destination } = column
    if (destination.index > 1) {
      const newColumnOrder = [...(fullColumnOrder.current as string[])]
      const oldIndex = newColumnOrder.indexOf(draggableId)
      newColumnOrder.splice(oldIndex, 1)
      newColumnOrder.splice(destination.index, 0, draggableId)
      setColumnOrder(newColumnOrder)
    }
  }

  const onDragEnd = () => {
    sendMessage({
      payload: columnOrder,
      type: MessageFromWebviewType.REORDER_COLUMNS
    })
  }

  return (
    <div className={styles.thead}>
      {headerGroups.map(headerGroup => (
        // eslint-disable-next-line react/jsx-key
        <MergedHeaderGroup
          {...headerGroup.getHeaderGroupProps()}
          orderedColumns={orderedColumns}
          headerGroup={headerGroup}
          columns={allHeaders}
          sorts={sorts}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  )
}
