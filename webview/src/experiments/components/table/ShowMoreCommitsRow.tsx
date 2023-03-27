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
    <div className={styles.showMoreCommits} data-testid="show-more-commits">
      <button
        className={styles.showMoreCommitsButton}
        onClick={showMoreCommits}
        disabled={!hasMoreCommits}
      >
        Show More Commits
      </button>
      <button
        className={styles.showMoreCommitsButton}
        onClick={showLessCommits}
        disabled={!isShowingMoreCommits}
      >
        Show Less Commits
      </button>
    </div>
  )
}
