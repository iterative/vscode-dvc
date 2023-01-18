import { CellContext } from '@tanstack/react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { CellContents } from './CellContent'
import { CellValue } from './Cell'
import styles from '../styles.module.scss'

interface UndefinedCellProps {
  cell: CellContext<Experiment, CellValue>
}

export const UndefinedCell: React.FC<UndefinedCellProps> = ({ cell }) => {
  const {
    column: { id: columnId },
    row: {
      original: { id: rowId }
    }
  } = cell
  return (
    <div className={styles.innerCell}>
      {columnId === 'Created' && rowId === 'workspace' ? (
        <></>
      ) : (
        <CellContents>-</CellContents>
      )}
    </div>
  )
}
