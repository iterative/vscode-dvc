import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React, { useCallback } from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { DragDropContext, DragUpdate } from 'react-beautiful-dnd'
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
    state: { columnOrder }
  },
  sorts,
  model
}) => {
  const orderedColumns = useColumnOrder(model.data?.columns || [], columnOrder)
  const allHeaders: HeaderGroup<Experiment>[] = []
  headerGroups.forEach(headerGroup => allHeaders.push(...headerGroup.headers))

  const memoizedSetColumnOrder = useCallback(setColumnOrder, [setColumnOrder])

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
      memoizedSetColumnOrder(colOrder)
    }
  }

  const onDragEnd = () => {
    model.persistColumnsOrder(columnOrder)
  }

  return (
    <div className={styles.thead}>
      {headerGroups.map(headerGroup => (
        // eslint-disable-next-line react/jsx-key
        <span {...headerGroup.getHeaderGroupProps()}>
          <DragDropContext onDragUpdate={onDragUpdate} onDragEnd={onDragEnd}>
            <MergedHeaderGroup
              orderedColumns={orderedColumns}
              headerGroup={headerGroup}
              columns={allHeaders}
              sorts={sorts}
            />
          </DragDropContext>
        </span>
      ))}
    </div>
  )
}
