import { PlotsComparisonData } from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useRef } from 'react'
import cx from 'classnames'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { ComparisonTableRow } from './ComparisonTableRow'
import styles from './styles.module.scss'
import plotsStyles from '../styles.module.scss'
import { withScale } from '../../../util/styles'

export type ComparisonTableProps = Omit<
  PlotsComparisonData,
  'sectionName' | 'size'
>

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  plots,
  revisions
}) => {
  const pinnedColumn = useRef('')
  const withoutPinned = (columns: string[]): string[] =>
    columns.filter(exp => exp !== pinnedColumn.current)

  const [columns, setColumns] = useState(
    [pinnedColumn.current, ...withoutPinned(Object.keys(revisions))].filter(
      Boolean
    )
  )
  const [dragOver, setDragOver] = useState('')

  const handleDragStart = (e: DragEvent<HTMLTableCellElement>) => {
    const { id } = e.currentTarget
    const idx = columns.indexOf(id)
    e.dataTransfer.setData('colIdx', idx.toString())
  }

  const handleDragOver = (e: DragEvent<HTMLTableCellElement>) =>
    e.preventDefault()
  const handleDragEnter = (e: DragEvent<HTMLTableCellElement>) => {
    const { id } = e.currentTarget
    setDragOver(id)
  }
  const handleOnDrop = (e: DragEvent<HTMLTableCellElement>) => {
    const { id } = e.currentTarget
    const droppedColIdx = columns.indexOf(id)

    if (columns[droppedColIdx] !== pinnedColumn.current) {
      const draggedColIdx = parseInt(e.dataTransfer.getData('colIdx'), 10)
      const tempCols = [...columns]

      tempCols[draggedColIdx] = columns[droppedColIdx]
      tempCols[droppedColIdx] = columns[draggedColIdx]
      setColumns(tempCols)
      setDragOver('')
    }
  }

  const changedPinnedColumn = (column: string) => {
    pinnedColumn.current = column
    setColumns([column, ...withoutPinned(columns)])
  }

  const headers = columns.map(exp => {
    const isPinned = exp === pinnedColumn.current
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
          onClicked={() => changedPinnedColumn(exp)}
          color={revisions[exp].color}
        >
          {exp}
        </ComparisonTableHeader>
      </th>
    )
  })

  return (
    <table
      className={plotsStyles.comparisonTable}
      style={withScale(columns.length)}
    >
      <thead>
        <tr>{headers}</tr>
      </thead>
      {plots.map(({ path, revisions }) => (
        <ComparisonTableRow
          key={path}
          path={path}
          plots={columns.map(column => revisions[column])}
          nbColumns={columns.length}
          pinnedColumn={pinnedColumn.current}
        />
      ))}
    </table>
  )
}
