import cx from 'classnames'
import React from 'react'
import styles from '../styles.module.scss'

interface PreviousCommitsRowProps {
  isBranchesView?: boolean
  nbColumns: number
}

export const PreviousCommitsRow: React.FC<PreviousCommitsRowProps> = ({
  isBranchesView,
  nbColumns
}) => (
  <tbody>
    <tr className={cx(styles.previousCommitsRow)}>
      <td className={cx(styles.previousCommitsText, styles.experimentsTd)}>
        {isBranchesView ? 'Other Branches' : 'Previous Commits'}
      </td>
      <td colSpan={nbColumns - 1}></td>
    </tr>
  </tbody>
)
