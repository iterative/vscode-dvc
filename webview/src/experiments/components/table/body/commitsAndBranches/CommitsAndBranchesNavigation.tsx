import React from 'react'
import { useSelector } from 'react-redux'
import { AddAndRemoveBranches } from './AddAndRemoveBranches'
import styles from './styles.module.scss'
import {
  showLessCommits,
  showMoreCommits,
  switchToBranchesView,
  switchToCommitsView
} from '../../../../util/messages'
import { ExperimentsState } from '../../../../store'

interface CommitsAndBranchesNavigationProps {
  branch: string
}

export const CommitsAndBranchesNavigation: React.FC<
  CommitsAndBranchesNavigationProps
> = ({ branch }) => {
  const { hasMoreCommits, isBranchesView, isShowingMoreCommits } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  return (
    <div className={styles.commitsAndBranchesNav}>
      {hasMoreCommits[branch] && (
        <button
          className={styles.commitsAndBranchesNavButton}
          onClick={() => showMoreCommits(branch)}
          disabled={isBranchesView}
        >
          Show More Commits
        </button>
      )}
      {isShowingMoreCommits[branch] && (
        <button
          className={styles.commitsAndBranchesNavButton}
          onClick={() => showLessCommits(branch)}
          disabled={isBranchesView}
        >
          Show Less Commits
        </button>
      )}

      <AddAndRemoveBranches />

      <span className={styles.separator} />

      <button
        className={styles.commitsAndBranchesNavButton}
        onClick={isBranchesView ? switchToCommitsView : switchToBranchesView}
      >
        {isBranchesView
          ? 'Switch to Commits View'
          : 'Switch to All Branches View'}
      </button>
    </div>
  )
}
