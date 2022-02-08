import React, { DragEvent } from 'react'
import cx from 'classnames'
import { ComparisonRevisions } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { ComparisonTableHeader } from './ComparisonTableHeader'

interface ComparisonTableHeadProps {
  columns: ComparisonRevisions
  pinnedColumn: string
  setColumnsOrder: (columns: string[]) => void
  setPinnedColumn: (column: string) => void
}

export const ComparisonTableHead: React.FC<ComparisonTableHeadProps> = ({
  columns,
  pinnedColumn,
  setColumnsOrder,
  setPinnedColumn
}) => {
  const cols = Object.keys(columns)

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
      const newColumnOrder = [...cols]
      const draggedColumn = newColumnOrder[draggedColIndex]

      newColumnOrder.splice(draggedColIndex, 1)
      newColumnOrder.splice(droppedColIndex, 0, draggedColumn)

      setColumnsOrder(newColumnOrder)
    }
  }

  return (
    <thead>
      <tr>
        {cols.map(exp => {
          const isPinned = exp === pinnedColumn
          return (
            <th
              key={exp}
              id={exp}
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
                onClicked={() => setPinnedColumn(exp)}
                color={columns[exp].color}
              >
                {exp}
              </ComparisonTableHeader>
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
