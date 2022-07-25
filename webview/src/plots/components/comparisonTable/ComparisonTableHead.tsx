import React from 'react'
import { Revision } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { DropTarget } from './DropTarget'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { DragDropContainer } from '../../../shared/components/dragDrop/DragDropContainer'
import { PlotsState } from '../../store'

export type ComparisonTableColumn = Revision

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
  const draggedId = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef?.itemId
  )

  const items = columns.map(({ revision, displayColor, group }) => {
    const isPinned = revision === pinnedColumn
    return (
      <th
        key={revision}
        id={revision}
        className={cx(styles.comparisonTableHeader, {
          [styles.pinnedColumnHeader]: isPinned,
          [styles.draggedColumn]: draggedId === revision
        })}
      >
        <ComparisonTableHeader
          isPinned={isPinned}
          onClicked={() => setPinnedColumn(revision)}
          displayColor={displayColor}
        >
          {revision}
          {group && <span className={styles.experimentName}>{group}</span>}
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
          dropTarget={<DropTarget />}
          shouldShowOnDrag
        />
      </tr>
    </thead>
  )
}
