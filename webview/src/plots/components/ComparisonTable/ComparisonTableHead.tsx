import React from 'react'
import { ComparisonRevision } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import cx from 'classnames'
import styles from './styles.module.scss'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { DragDropContainer } from '../../../shared/components/DragDrop/DragDropContainer'
import { reorderObjectList } from '../../../util/objects'
import { sendMessage } from '../../../shared/vscode'

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
    const newOrder = reorderObjectList(
      order,
      columns,
      'revision'
    ) as ComparisonRevision[]
    setColumnsOrder(newOrder)
    sendMessage({
      payload: newOrder.map(({ revision }) => revision),
      type: MessageFromWebviewType.PLOTS_COMPARISON_REORDERED
    })
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
          group="comparison"
        />
      </tr>
    </thead>
  )
}
