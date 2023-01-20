import { CellContext } from '@tanstack/react-table'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { CellValue } from './Cell'
import styles from '../styles.module.scss'

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit'
})
const dateFormatter = new Intl.DateTimeFormat([], {
  dateStyle: 'medium'
})

export const DateCellContents: React.FC<
  CellContext<Experiment, CellValue>
> = cell => {
  const value = cell.getValue()
  if (!value) {
    return null
  }
  const date = new Date(value as string)
  return (
    <div className={styles.timestampInnerCell}>
      <span className={styles.cellContents}>
        <div className={styles.timestampTime}>{timeFormatter.format(date)}</div>
        <div className={styles.timestampDate}>{dateFormatter.format(date)}</div>
      </span>
    </div>
  )
}
