import React from 'react'
import { useSelector } from 'react-redux'
import { showLessCommits, showMoreCommits } from './messages'
import styles from './styles.module.scss'
import { ExperimentsState } from '../../store'

export const ShowMoreCommitsRow: React.FC = () => {
  const { hasMoreCommits, isShowingMoreCommits } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  return (
    <div className={styles.showMoreCommits}>
      {hasMoreCommits && (
        <button
          className={styles.showMoreCommitsButton}
          onClick={showMoreCommits}
          data-testid="show-more-commits"
        >
          Show More Commits
        </button>
      )}
      {isShowingMoreCommits && (
        <button
          className={styles.showMoreCommitsButton}
          onClick={showLessCommits}
          data-testid="show-less-commits"
        >
          Show Less Commits
        </button>
      )}
    </div>
  )
}
