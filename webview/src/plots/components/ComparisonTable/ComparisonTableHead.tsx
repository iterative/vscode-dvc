import React, { DragEvent } from 'react'
import { ComparisonRevision } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import styles from './styles.module.scss'
import { ComparisonTableHeader } from './ComparisonTableHeader'

export type ComparisonTableColumn = ComparisonRevision

interface ComparisonTableHeadProps {
  columns: ComparisonTableColumn[]
  pinnedColumn: string
  setColumnsOrder: (columns: ComparisonTableColumn[]) => void
  setPinnedColumn: (column: string) => void
}

export const ComparisonTableHead: React.FC<ComparisonTableHeadProps> = ({
  columns,
  pinnedColumn,
  setColumnsOrder,
  setPinnedColumn
}) => {
  const cols = columns.map(col => col.revision)

  const handleDragStart = (e: DragEvent<HTMLTableCellElement>) => {
    const id = cols.indexOf(e.currentTarget.id).toString()
    e.dataTransfer.setData('colIndex', id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragOver = (e: DragEvent<HTMLTableCellElement>) =>
    e.preventDefault()

  const handleOnDrop = (e: DragEvent<HTMLTableCellElement>) => {
    const droppedColIndex = cols.indexOf(e.currentTarget.id)

    if (cols[droppedColIndex] !== pinnedColumn) {
      const draggedColIndex = parseInt(e.dataTransfer.getData('colIndex'), 10)
      const newColumnOrder = [...columns]
      const draggedColumn = newColumnOrder[draggedColIndex]

      newColumnOrder.splice(draggedColIndex, 1)
      newColumnOrder.splice(droppedColIndex, 0, draggedColumn)

      setColumnsOrder(newColumnOrder)
    }
  }

  return (
    <thead>
      <tr>
        {columns.map(({ revision, displayColor }) => {
          const isPinned = revision === pinnedColumn
          return (
            <th
              key={revision}
              id={revision}
              className={cx(styles.comparisonTableHeader, {
                [styles.pinnedColumnHeader]: isPinned
              })}
              draggable={!isPinned}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleOnDrop}
            >
              <ComparisonTableHeader
                isPinned={isPinned}
                onClicked={() => setPinnedColumn(revision)}
                displayColor={displayColor}
              >
                {revision}
              </ComparisonTableHeader>
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
