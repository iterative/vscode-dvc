import cx from 'classnames'
import React from 'react'
import { CommitsAndBranchesNavigation } from './commitsAndBranches/CommitsAndBranchesNavigation'
import styles from '../styles.module.scss'

interface PreviousCommitsRowProps {
  isBranchesView?: boolean
  nbColumns: number
}

export const PreviousCommitsRow: React.FC<PreviousCommitsRowProps> = ({
  isBranchesView,
  nbColumns
}) => (
  <thead>
    <tr className={cx(styles.previousCommitsRow)}>
      <th className={cx(styles.previousCommitsText, styles.experimentsTd)}>
        {isBranchesView ? 'Other Branches' : 'Previous Commits'}
      </th>
      <th colSpan={nbColumns - 1}>
        <CommitsAndBranchesNavigation />
      </th>
    </tr>
  </thead>
)
