import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { DragUpdate } from 'react-beautiful-dnd'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { MergedHeaderGroup } from './MergeHeaderGroups'
import { useColumnOrder } from '../../hooks/useColumnOrder'
import { sendMessage } from '../../../shared/vscode'

interface TableHeadProps {
  instance: TableInstance<Experiment>
  columns: MetricOrParam[]
  sorts: SortDefinition[]
}

export const TableHead: React.FC<TableHeadProps> = ({
  instance: {
    headerGroups,
    setColumnOrder,
    state: { columnOrder }
  },
  columns,
  sorts
}) => {
  const orderedColumns = useColumnOrder(columns, columnOrder)
  const allHeaders: HeaderGroup<Experiment>[] = []
  headerGroups.forEach(headerGroup => allHeaders.push(...headerGroup.headers))

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
    sendMessage({
      payload: columnOrder,
      type: MessageFromWebviewType.COLUMN_REORDERED
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
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  )
}
