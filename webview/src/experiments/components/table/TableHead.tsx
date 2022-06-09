import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import React, { useRef } from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import styles from './styles.module.scss'
import { MergedHeaderGroups } from './MergeHeaderGroups'
import { useColumnOrder } from '../../hooks/useColumnOrder'
import { sendMessage } from '../../../shared/vscode'
import { leafColumnIds, reorderColumnIds } from '../../util/columns'
import {
  OnDragOver,
  OnDragStart
} from '../../../shared/components/dragDrop/DragDropWorkbench'

interface TableHeadProps {
  instance: TableInstance<Experiment>
  columns: Column[]
  sorts: SortDefinition[]
  filters: string[]
}

export const TableHead: React.FC<TableHeadProps> = ({
  filters,
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

  const onDragStart: OnDragStart = draggedId => {
    const displacerHeader = allHeaders.find(header => header.id === draggedId)
    if (displacerHeader) {
      draggingIds.current = leafColumnIds(displacerHeader)
      fullColumnOrder.current = allColumns.map(({ id }) => id)
    }
  }

  const findDisplacedHeader = (
    draggedOverId: string,
    cb: (displacedHeader: HeaderGroup<Experiment>) => void
  ) => {
    const displacedHeader = allHeaders.find(
      header => header.id === draggedOverId
    )

    displacedHeader && cb(displacedHeader)
  }

  const onDragUpdate: OnDragOver = (_, draggedOverId: string) => {
    const displacer = draggingIds.current
    displacer &&
      findDisplacedHeader(draggedOverId, displacedHeader => {
        const displaced = leafColumnIds(displacedHeader)
        if (!displaced.some(id => displacer.includes(id))) {
          fullColumnOrder.current &&
            setColumnOrder(
              reorderColumnIds(fullColumnOrder.current, displacer, displaced)
            )
        }
      })
  }

  const onDragEnd = () => {
    draggingIds.current = undefined
    fullColumnOrder.current = undefined
    sendMessage({
      payload: columnOrder,
      type: MessageFromWebviewType.REORDER_COLUMNS
    })
  }

  return (
    <div className={styles.thead}>
      {headerGroups.map(headerGroup => (
        // eslint-disable-next-line react/jsx-key
        <MergedHeaderGroups
          {...headerGroup.getHeaderGroupProps()}
          orderedColumns={orderedColumns}
          headerGroup={headerGroup}
          columns={allHeaders}
          sorts={sorts}
          filters={filters}
          onDragStart={onDragStart}
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  )
}
