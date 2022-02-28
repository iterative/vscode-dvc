import React from 'react'
import { ComparisonRevision } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import styles from './styles.module.scss'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { DragDropContainer } from '../../../shared/components/dragDrop/DragDropContainer'
import { reorderObjectList } from '../../../util/objects'

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
  const setOrder = (order: string[]) => {
    const newOrder = reorderObjectList(order, columns, 'revision')
    setColumnsOrder(newOrder as ComparisonRevision[])
  }

  const items = columns.map(({ revision, displayColor }) => {
    const isPinned = revision === pinnedColumn
    return (
      <th
        key={revision}
        id={revision}
        className={cx(styles.comparisonTableHeader, {
          [styles.pinnedColumnHeader]: isPinned
        })}
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
  })

  return (
    <thead>
      <tr>
        <DragDropContainer
          order={columns.map(col => col.revision)}
          setOrder={setOrder}
          disabledDropIds={[pinnedColumn]}
          items={items}
        />
      </tr>
    </thead>
  )
}
