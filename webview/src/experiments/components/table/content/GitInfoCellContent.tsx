import React from 'react'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { CellContext } from '@tanstack/react-table'
import { CellValue } from './Cell'
import styles from '../styles.module.scss'
import { Icon } from '../../../../shared/components/Icon'
import { GitCommit, GitMerge } from '../../../../shared/components/icons'

export const GitInfoCellContent: React.FC<
  CellContext<Experiment, CellValue>
> = cell => {
  const {
    row: {
      original: { branch, baselineSha, sha }
    }
  } = cell as unknown as CellContext<Experiment, CellValue>
  const labelSha = baselineSha?.slice(0, 7) || sha?.slice(0, 7)

  if (!branch) {
    return (
      <div
        className={styles.gitInfoInnerCell}
        style={{ width: cell.column.getSize() }}
      ></div>
    )
  }

  return (
    <div
      className={styles.gitInfoInnerCell}
      style={{ width: cell.column.getSize() }}
    >
      <span className={styles.cellContents}>
        <div className={styles.gitInfoBranch}>
          <Icon
            className={styles.icon}
            icon={GitMerge}
            width={12}
            height={12}
          />
          <span>{branch}</span>
        </div>
        {labelSha && (
          <div className={styles.gitInfoCommit}>
            <Icon
              className={styles.icon}
              icon={GitCommit}
              width={12}
              height={12}
            />
            <span>{labelSha}</span>
          </div>
        )}
      </span>
    </div>
  )
}
