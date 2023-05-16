import React from 'react'
import { useSelector } from 'react-redux'
import { AddAndRemoveBranches } from './AddAndRemoveBranches'
import styles from './styles.module.scss'
import { showLessCommits, showMoreCommits } from '../../../../util/messages'
import { ExperimentsState } from '../../../../store'

interface CommitsAndBranchesNavigationProps {
  branch: string
}

export const CommitsAndBranchesNavigation: React.FC<
  CommitsAndBranchesNavigationProps
> = ({ branch }) => {
  const { hasMoreCommits, isShowingMoreCommits } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  return (
    <div className={styles.commitsAndBranchesNav}>
      {hasMoreCommits[branch] && (
        <button
          className={styles.commitsAndBranchesNavButton}
          onClick={() => showMoreCommits(branch)}
        >
          Show More Commits
        </button>
      )}
      {isShowingMoreCommits[branch] && (
        <button
          className={styles.commitsAndBranchesNavButton}
          onClick={() => showLessCommits(branch)}
        >
          Show Less Commits
        </button>
      )}

      <AddAndRemoveBranches />
    </div>
  )
}
