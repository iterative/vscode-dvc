import React from 'react'
import { TableRow } from './Row'
import styles from '../styles.module.scss'
import { RowProp } from '../../../util/interfaces'

export const NestedRow: React.FC<RowProp & { isExpanded: boolean }> = ({
  row,
  isExpanded
}) => {
  return (
    <TableRow row={row} isExpanded={isExpanded} className={styles.nestedRow} />
  )
}
