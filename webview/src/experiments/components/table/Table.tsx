import React, { useRef, useState, CSSProperties, useContext } from 'react'
import { ColumnOrderState } from '@tanstack/react-table'
import cx from 'classnames'
import styles from './styles.module.scss'
import { TableHead } from './header/TableHead'
import { RowSelectionContext } from './RowSelectionContext'
import { Indicators } from './Indicators'
import { CommitsAndBranchesNavigation } from './commitsAndBranches/CommitsAndBranchesNavigation'
import { TableContent } from './body/TableContent'
import { InstanceProp } from '../../util/interfaces'

interface TableProps extends InstanceProp {
  onColumnOrderChange: (order: ColumnOrderState) => void
}

export const Table: React.FC<TableProps> = ({
  instance,
  onColumnOrderChange
}) => {
  const { clearSelectedRows } = useContext(RowSelectionContext)
  const [expColumnNeedsShadow, setExpColumnNeedsShadow] = useState(false)
  const [tableHeadHeight, setTableHeadHeight] = useState(55)

  const tableRef = useRef<HTMLTableElement>(null)

  return (
    <div
      className={styles.tableContainer}
      style={{ '--table-head-height': `${tableHeadHeight}px` } as CSSProperties}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <table
        className={cx(
          styles.experimentsTable,
          expColumnNeedsShadow && styles.withExpColumnShadow
        )}
        ref={tableRef}
        onKeyUp={e => {
          if (e.key === 'Escape') {
            clearSelectedRows?.()
          }
        }}
      >
        <TableHead
          instance={instance}
          root={tableRef.current}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
          setTableHeadHeight={setTableHeadHeight}
          onOrderChange={onColumnOrderChange}
        />
        <TableContent
          instance={instance}
          tableRef={tableRef}
          tableHeadHeight={tableHeadHeight}
        />
      </table>
      <CommitsAndBranchesNavigation />
      <Indicators />
    </div>
  )
}
