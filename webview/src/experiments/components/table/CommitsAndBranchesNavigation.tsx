import React from 'react'
import { useSelector } from 'react-redux'
import {
  showLessCommits,
  showMoreCommits,
  switchToBranchesView,
  switchToCommitsView
} from './messages'
import styles from './styles.module.scss'
import { ExperimentsState } from '../../store'

export const CommitsAndBranchesNavigation: React.FC = () => {
  const { hasMoreCommits, isBranchesView, isShowingMoreCommits } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  return (
    <div className={styles.commitsAndBranchesNav}>
      {hasMoreCommits && (
        <button
          className={styles.commitsAndBranchesNavButton}
          onClick={showMoreCommits}
          data-testid="show-more-commits"
          disabled={isBranchesView}
        >
          Show More Commits
        </button>
      )}
      {isShowingMoreCommits && (
        <button
          className={styles.commitsAndBranchesNavButton}
          onClick={showLessCommits}
          data-testid="show-less-commits"
          disabled={isBranchesView}
        >
          Show Less Commits
        </button>
      )}
      <span className={styles.separator} />

      <button
        className={styles.commitsAndBranchesNavButton}
        onClick={isBranchesView ? switchToCommitsView : switchToBranchesView}
      >
        {isBranchesView ? 'Switch to Commits View' : 'Switch to Branches View'}
      </button>
    </div>
  )
}
