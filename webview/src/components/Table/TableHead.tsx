import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { DragDropContext, DragUpdate } from 'react-beautiful-dnd'
import styles from './styles.module.scss'
import { MergedHeaderGroup } from './MergeHeaderGroups'
import { useMessaging } from '../../util/useMessaging'

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
  const sendMessage = useMessaging()

  const onDragUpdate = (column: DragUpdate) => {
    if (!column.destination) {
      return
    }
    const { draggableId, destination } = column
    const colOrder = [...currentColOrder.current]
    const oldIndex = colOrder.indexOf(draggableId)

    colOrder.splice(oldIndex, 1)
    colOrder.splice(destination.index, 0, draggableId)
    setColumnOrder(colOrder)
    sendMessage({
      payload: colOrder,
      type: MessageFromWebviewType.columnReordered
    })
  }
  const doNothing = () => {}

  React.useEffect(() => {
    setColumnOrder(columnsOrder)
  }, [columnsOrder, setColumnOrder])

  currentColOrder.current = allColumns?.map(o => o.id)

  return (
    <div className={styles.thead}>
      {headerGroups.map((headerGroup, i) => (
        <DragDropContext
          onDragStart={doNothing}
          onDragUpdate={onDragUpdate}
          onDragEnd={doNothing}
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
