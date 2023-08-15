import React from 'react'
import { RowContent } from './Row'
import styles from '../styles.module.scss'
import { RowProp } from '../../../util/interfaces'

export const NestedRow: React.FC<RowProp> = ({ row }) => {
  return <RowContent row={row} className={styles.nestedRow} />
}
