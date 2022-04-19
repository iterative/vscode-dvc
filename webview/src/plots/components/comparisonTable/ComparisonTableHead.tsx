import React, { useRef } from 'react'
import { ComparisonRevision } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import styles from './styles.module.scss'
import { DropTarget } from './DropTarget'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import {
  DragDropContainer,
  DraggedInfo
} from '../../../shared/components/dragDrop/DragDropContainer'

export type ComparisonTableColumn = ComparisonRevision

interface ComparisonTableHeadProps {
  columns: ComparisonTableColumn[]
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
  const draggedRef = useRef<DraggedInfo>()

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
          setOrder={setColumnsOrder}
          disabledDropIds={[pinnedColumn]}
          items={items}
          group="comparison"
          draggedRef={draggedRef}
          dropTarget={{
            element: <DropTarget />,
            wrapperTag: 'th'
          }}
        />
      </tr>
    </thead>
  )
}
