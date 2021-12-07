import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { DragUpdate } from 'react-beautiful-dnd'
import styles from './styles.module.scss'
import { MergedHeaderGroup } from './MergeHeaderGroups'
import { Model } from '../../model'
import { useColumnOrder } from '../../hooks/useColumnOrder'

interface TableHeadProps {
  instance: TableInstance<Experiment>
  sorts: SortDefinition[]
  model: Model
}

export const TableHead: React.FC<TableHeadProps> = ({
  instance: {
    headerGroups,
    setColumnOrder,
    allColumns,
    state: { columnOrder }
  },
  sorts,
  model
}) => {
  const orderedColumns = useColumnOrder(model.data?.columns || [], columnOrder)
  const allHeaders: HeaderGroup<Experiment>[] = []
  headerGroups.forEach(headerGroup => allHeaders.push(...headerGroup.headers))

  const onDragStart = () => {
    setColumnOrder(allColumns.map(column => column.id))
  }

  const onDragUpdate = (column: DragUpdate) => {
    if (!column.destination) {
      return
    }
    const { draggableId, destination } = column
    if (destination.index > 1) {
      const colOrder = [...columnOrder]
      const oldIndex = colOrder.indexOf(draggableId)

      colOrder.splice(oldIndex, 1)
      colOrder.splice(destination.index, 0, draggableId)
      setColumnOrder(colOrder)
    }
  }

  const onDragEnd = () => {
    model.persistColumnOrder(columnOrder)
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
