import React from 'react'
import { BatchSelectionProp, RowContent } from './Row'
import styles from '../styles.module.scss'
import { RowProp } from '../../../util/interfaces'

export const NestedRow: React.FC<RowProp & BatchSelectionProp> = ({
  row,
  batchRowSelection
}) => {
  return (
    <RowContent
      row={row}
      className={styles.nestedRow}
      batchRowSelection={batchRowSelection}
    />
  )
}
