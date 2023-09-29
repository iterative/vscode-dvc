import React from 'react'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { CellContext } from '@tanstack/react-table'
import { CellValue } from './Cell'
import styles from '../styles.module.scss'
import { Icon } from '../../../../shared/components/Icon'
import { GitMerge } from '../../../../shared/components/icons'

export const BranchCellContent: React.FC<
  CellContext<Experiment, CellValue>
> = cell => {
  const {
    row: {
      original: { branch }
    }
  } = cell as unknown as CellContext<Experiment, CellValue>

  if (!branch) {
    return (
      <div
        className={styles.branchInnerCell}
        style={{ width: cell.column.getSize() }}
      ></div>
    )
  }

  return (
    <div
      className={styles.branchInnerCell}
      style={{ width: cell.column.getSize() }}
    >
      <div className={styles.cellContents}>
        <Icon icon={GitMerge} width={13} height={13} />
        <span>{branch}</span>
      </div>
    </div>
  )
}
