import React, { DragEvent, useState } from 'react'
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
  const [dragOver, setDragOver] = useState('')
  const cols = Object.keys(columns)

  const handleDragStart = (e: DragEvent<HTMLTableCellElement>) => {
    const id = cols.indexOf(e.currentTarget.id).toString()
    e.dataTransfer.setData('colId', id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragOver = (e: DragEvent<HTMLTableCellElement>) =>
    e.preventDefault()

  const handleDragEnter = (e: DragEvent<HTMLTableCellElement>) =>
    setDragOver(e.currentTarget.id)

  const handleOnDrop = (e: DragEvent<HTMLTableCellElement>) => {
    const droppedColId = cols.indexOf(e.currentTarget.id)

    if (cols[droppedColId] !== pinnedColumn) {
      const draggedColId = parseInt(e.dataTransfer.getData('colId'), 10)
      const tempColumns = [...cols]

      tempColumns[draggedColId] = cols[droppedColId]
      tempColumns[droppedColId] = cols[draggedColId]

      setColumnsOrder(tempColumns)
      setDragOver('')
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
                [styles.pinnedColumnHeader]: isPinned,
                [styles.other]: dragOver === exp
              })}
              draggable={!isPinned}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleOnDrop}
              onDragEnter={handleDragEnter}
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
