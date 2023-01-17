import React, {
  useRef,
  useState,
  CSSProperties,
  useContext,
  useCallback
} from 'react'
import { useSelector } from 'react-redux'
import { ColumnOrderState } from '@tanstack/react-table'
import cx from 'classnames'
import styles from './styles.module.scss'
import { TableHead } from './header/TableHead'
import { InstanceProp, RowProp } from './interfaces'
import { RowSelectionContext } from './RowSelectionContext'
import { TableBody } from './TableBody'
import { useClickOutside } from '../../../shared/hooks/useClickOutside'
import { ExperimentsState } from '../../store'
import { Indicators } from './Indicators'
import { getSelectedForPlotsCount } from '../../util/rows'

interface TableProps extends InstanceProp {
  onColumnOrderChange: (order: ColumnOrderState) => void
}

export const Table: React.FC<TableProps> = ({
  instance,
  onColumnOrderChange
}) => {
  const { rows, flatRows } = instance.getRowModel()

  const hasCheckpoints = useSelector(
    (state: ExperimentsState) => state.tableData.hasCheckpoints
  )
  const hasRunningExperiment = useSelector(
    (state: ExperimentsState) => state.tableData.hasRunningExperiment
  )

  const { clearSelectedRows, batchSelection, lastSelectedRow } =
    useContext(RowSelectionContext)
  const [expColumnNeedsShadow, setExpColumnNeedsShadow] = useState(false)
  const [tableHeadHeight, setTableHeadHeight] = useState(55)

  const tableRef = useRef<HTMLTableElement>(null)

  const clickOutsideHandler = useCallback(() => {
    clearSelectedRows?.()
  }, [clearSelectedRows])

  useClickOutside(tableRef, clickOutsideHandler)

  const batchRowSelection = useCallback(
    ({ row: { id } }: RowProp) => {
      const lastSelectedRowId = lastSelectedRow?.row.id ?? ''
      const lastIndex =
        flatRows.findIndex(flatRow => flatRow.id === lastSelectedRowId) || 1
      const selectedIndex =
        flatRows.findIndex(flatRow => flatRow.id === id) || 1
      const rangeStart = Math.min(lastIndex, selectedIndex)
      const rangeEnd = Math.max(lastIndex, selectedIndex)

      const collapsedIds = flatRows
        .filter(flatRow => !flatRow.getIsExpanded())
        .map(flatRow => flatRow.id)

      const batch = flatRows
        .slice(rangeStart, rangeEnd + 1)
        .filter(
          flatRow =>
            !collapsedIds.some(collapsedId =>
              flatRow.id.startsWith(`${collapsedId}.`)
            )
        )
        .map(row => ({ row }))

      batchSelection?.(batch)
    },
    [flatRows, batchSelection, lastSelectedRow]
  )

  const selectedForPlotsCount = getSelectedForPlotsCount(rows)

  return (
    <div
      className={styles.tableContainer}
      style={{ '--table-head-height': `${tableHeadHeight}px` } as CSSProperties}
    >
      <table
        className={cx(expColumnNeedsShadow && styles.withExpColumnShadow)}
        ref={tableRef}
        tabIndex={0}
        role="tree"
        onKeyUp={e => {
          if (e.key === 'Escape') {
            clearSelectedRows?.()
          }
        }}
        style={{
          width:
            instance.getCenterTotalSize() +
            (instance.getAllLeafColumns().length + 1) * 3
        }}
      >
        <TableHead
          instance={instance}
          root={tableRef.current}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
          setTableHeadHeight={setTableHeadHeight}
          onOrderChange={onColumnOrderChange}
        />
        {rows.map(row => (
          <TableBody
            tableHeaderHeight={tableHeadHeight}
            root={tableRef.current}
            row={row}
            instance={instance}
            key={row.id}
            hasRunningExperiment={hasRunningExperiment}
            projectHasCheckpoints={hasCheckpoints}
            batchRowSelection={batchRowSelection}
          />
        ))}
      </table>
      <Indicators selectedForPlotsCount={selectedForPlotsCount} />
    </div>
  )
}
