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
      original: { flatBranches = [] }
    }
  } = cell as unknown as CellContext<Experiment, CellValue>

  if (flatBranches.length === 0) {
    return (
      <div
        className={styles.branchInnerCell}
        style={{ width: cell.column.getSize() }}
      ></div>
    )
  }

  const isSingleBranch = flatBranches.length === 1
  const [firstBranch, secondBranch, ...restOfBranches] = flatBranches

  return (
    <Tooltip
      content={flatBranches.join(', ')}
      placement="bottom-start"
      delay={NORMAL_TOOLTIP_DELAY}
    >
      <div
        className={styles.branchInnerCell}
        style={{ width: cell.column.getSize() }}
      >
        <div className={styles.cellContents}>
          <Icon icon={GitMerge} width={13} height={13} />
          <ul
            className={cx(
              styles.branchCellList,
              isSingleBranch && styles.branchCellListSingleItem
            )}
          >
            <li>{firstBranch}</li>
            {secondBranch && (
              <li>
                {secondBranch}
                {restOfBranches.length > 0 &&
                  ` + ${restOfBranches.length} more`}
              </li>
            )}
          </ul>
        </div>
      </div>
    </Tooltip>
  )
}
