import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import React, { useRef } from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { DragUpdate, OnDragStartResponder } from 'react-beautiful-dnd'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { MergedHeaderGroup } from './MergeHeaderGroups'
import { useColumnOrder } from '../../hooks/useColumnOrder'
import { sendMessage } from '../../../shared/vscode'
import { leafColumnIds, reorderColumnIds } from '../../util/columns'

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
  const draggingIds = useRef<string[]>()
  const dragging = useRef<HeaderGroup<Experiment>>()

  const onDragStart: OnDragStartResponder = ({ source }) => {
    const sourceGroup =
      headerGroups[Number.parseInt(source.droppableId.split('_')[1], 10)]
    const headers = [...sourceGroup.headers]
    dragging.current = headers[source.index]
    draggingIds.current = leafColumnIds(headers[source.index])
    fullColumnOrder.current = allColumns.map(({ id }) => id)
  }

  const onDragUpdate = (column: DragUpdate) => {
    if (!column.destination) {
      return
    }
    const { destination, source } = column
    if (destination.index > 1 && destination.index !== source.index) {
      const targetGroup =
        headerGroups[Number.parseInt(destination.droppableId.split('_')[1], 10)]
      const headers = [...targetGroup.headers]
      const displaced = leafColumnIds(headers[destination.index])
      const displacer = draggingIds.current || []
      fullColumnOrder.current &&
        setColumnOrder(
          reorderColumnIds(fullColumnOrder.current, displacer, displaced)
        )
    }
  }

  const onDragEnd = () => {
    dragging.current = undefined
    sendMessage({
      payload: columnOrder,
      type: MessageFromWebviewType.REORDER_COLUMNS
    })
  }

  return (
    <div className={styles.thead}>
      {headerGroups.map((headerGroup, i) => (
        // eslint-disable-next-line react/jsx-key
        <MergedHeaderGroup
          {...headerGroup.getHeaderGroupProps()}
          orderedColumns={orderedColumns}
          headerGroup={headerGroup}
          columns={allHeaders}
          sorts={sorts}
          index={i}
          dragging={dragging.current}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  )
}
