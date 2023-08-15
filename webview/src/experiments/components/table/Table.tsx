import React, { useRef, useState, CSSProperties, useEffect } from 'react'
import cx from 'classnames'
import { useDispatch } from 'react-redux'
import styles from './styles.module.scss'
import { TableHead } from './header/TableHead'
import { TableContent } from './body/TableContent'
import { InstanceProp } from '../../util/interfaces'
import {
  clearSelectedRows,
  updateRowOrder
} from '../../state/rowSelectionSlice'

export const Table: React.FC<InstanceProp> = ({ instance }) => {
  const dispatch = useDispatch()

  const [expColumnNeedsShadow, setExpColumnNeedsShadow] = useState(false)
  const [tableHeadHeight, setTableHeadHeight] = useState(55)

  const tableRef = useRef<HTMLTableElement>(null)

  const { setColumnOrder, getHeaderGroups, getAllLeafColumns, getRowModel } =
    instance

  const { rows, flatRows } = getRowModel()

  useEffect(() => {
    dispatch(
      updateRowOrder(
        flatRows.map(
          ({ depth, original: { branch, id, executorStatus, starred } }) => ({
            branch,
            depth,
            executorStatus,
            id,
            starred
          })
        )
      )
    )
  }, [dispatch, flatRows])

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
          columnOrder={getAllLeafColumns().map(({ id }) => id)}
          headerGroups={getHeaderGroups()}
          setColumnOrder={setColumnOrder}
          root={tableRef.current}
          setExpColumnNeedsShadow={setExpColumnNeedsShadow}
          setTableHeadHeight={setTableHeadHeight}
        />
        <TableContent
          rows={rows}
          tableHeadHeight={tableHeadHeight}
          tableRef={tableRef}
        />
      </table>
    </div>
  )
}
