import React from 'react'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { CellContext } from '@tanstack/react-table'
import { CellValue } from './Cell'
import styles from '../styles.module.scss'
import { Icon } from '../../../../shared/components/Icon'
import { GitCommit } from '../../../../shared/components/icons'

export const CommitCellContent: React.FC<
  CellContext<Experiment, CellValue>
> = cell => {
  const {
    row: {
      original: { baselineSha, sha }
    }
  } = cell as unknown as CellContext<Experiment, CellValue>
  const labelSha = baselineSha?.slice(0, 7) || sha?.slice(0, 7)

  if (!labelSha) {
    return (
      <div
        className={styles.commitInnerCell}
        style={{ width: cell.column.getSize() }}
      ></div>
    )
  }

  return (
    <div
      className={styles.commitInnerCell}
      style={{ width: cell.column.getSize() }}
    >
      <div className={styles.cellContents}>
        <Icon icon={GitCommit} width={14} height={14} />
        <span>{labelSha}</span>
      </div>
    </div>
  )
}
