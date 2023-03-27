import React from 'react'
import { useSelector } from 'react-redux'
import { showMoreCommits } from './messages'
import styles from './styles.module.scss'
import { ExperimentsState } from '../../store'

export const ShowMoreCommitsRow: React.FC = () => {
  const hasMoreCommits = useSelector(
    (state: ExperimentsState) => state.tableData.hasMoreCommits
  )

  return hasMoreCommits ? (
    <div className={styles.showMoreCommits}>
      <button
        className={styles.showMoreCommitsButton}
        onClick={showMoreCommits}
        data-testid="show-more-commits"
      >
        Show More Commits
      </button>
    </div>
  ) : null
}
