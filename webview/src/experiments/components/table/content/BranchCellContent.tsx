import React from 'react'
import cx from 'classnames'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import { CellContext } from '@tanstack/react-table'
import { CellValue } from './Cell'
import styles from '../styles.module.scss'
import { Icon } from '../../../../shared/components/Icon'
import { GitMerge } from '../../../../shared/components/icons'
import Tooltip, {
  NORMAL_TOOLTIP_DELAY
} from '../../../../shared/components/tooltip/Tooltip'

export const BranchCellContent: React.FC<
  CellContext<Experiment, CellValue>
> = cell => {
  const {
    row: {
      original: { branch, allBranches = [] }
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

  const hasMultiBranches = allBranches.length > 1

  return (
    <Tooltip
      content={allBranches.join(', ')}
      placement="bottom-end"
      delay={NORMAL_TOOLTIP_DELAY}
    >
      <div
        className={styles.branchInnerCell}
        style={{ width: cell.column.getSize() }}
      >
        <div className={styles.cellContents}>
          <Icon icon={GitMerge} width={13} height={13} />
          <span
            className={cx(
              styles.branchCellText,
              hasMultiBranches && styles.branchCellTextMultiLine
            )}
          >
            <span>{branch}</span>
            {hasMultiBranches && (
              <span>
                {allBranches[1]}
                {allBranches.length > 2 && ` + ${allBranches.length - 2} more`}
              </span>
            )}
          </span>
        </div>
      </div>
    </Tooltip>
  )
}
