import React, { useRef, useState, CSSProperties } from 'react'
import cx from 'classnames'
import { useDispatch } from 'react-redux'
import styles from './styles.module.scss'
import { TableHead } from './header/TableHead'
import { TableContent } from './body/TableContent'
import { InstanceProp } from '../../util/interfaces'
import { clearSelectedRows } from '../../state/rowSelectionSlice'

export const Table: React.FC<InstanceProp> = ({ instance }) => {
  const dispatch = useDispatch()

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
            dispatch(clearSelectedRows())
          }
        }}
      >
        <TableHead
          instance={instance}
          root={tableRef.current}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
          setTableHeadHeight={setTableHeadHeight}
        />
        <TableContent
          instance={instance}
          tableRef={tableRef}
          tableHeadHeight={tableHeadHeight}
        />
      </table>
    </div>
  )
}
