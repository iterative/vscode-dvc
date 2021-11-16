import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React, { useCallback, useEffect } from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { DragDropContext, DragUpdate } from 'react-beautiful-dnd'
import styles from './styles.module.scss'
import { MergedHeaderGroup } from './MergeHeaderGroups'
import { useColumnOrder } from '../../hooks/useColumnsOrder'

interface TableHeadProps {
  instance: TableInstance<Experiment>
  sorts: SortDefinition[]
  columnsOrder: string[]
}

export const TableHead: React.FC<TableHeadProps> = ({
  instance: { headerGroups, setColumnOrder, allColumns },
  sorts,
  columnsOrder
}) => {
  const allHeaders: HeaderGroup<Experiment>[] = []
  headerGroups.forEach(headerGroup => allHeaders.push(...headerGroup.headers))
  const currentColOrder = React.useRef<string[]>(columnsOrder)
  const [, setColumnOrderRepresentation] = useColumnOrder()
  const memoizedSetColumnOrder = useCallback(
    (colsOrder: string[]) => setColumnOrder(colsOrder),
    [setColumnOrder]
  )

  const onDragUpdate = (column: DragUpdate) => {
    if (!column.destination) {
      return
    }
    const { draggableId, destination } = column
    if (destination.index > 1) {
      const colOrder = [...currentColOrder.current]
      const oldIndex = colOrder.indexOf(draggableId)

      colOrder.splice(oldIndex, 1)
      colOrder.splice(destination.index, 0, draggableId)
      memoizedSetColumnOrder(colOrder)
    }
  }

  const onDragEnd = () => {
    if (currentColOrder.current !== columnsOrder) {
      setColumnOrderRepresentation(currentColOrder.current)
    }
  }

  useEffect(() => {
    memoizedSetColumnOrder(columnsOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedSetColumnOrder])

  currentColOrder.current = allColumns?.map(o => o.id)

  return (
    <div className={styles.thead}>
      {headerGroups.map((headerGroup, i) => (
        <DragDropContext
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
          key={`header-group-${headerGroup.id}-${i}`}
        >
          <MergedHeaderGroup
            headerGroup={headerGroup}
            columns={allHeaders}
            sorts={sorts}
          />
        </DragDropContext>
      ))}
    </div>
  )
}
