import React from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { CommitsButton, CommitsButtonType } from './CommitsButton'
import { showLessCommits, showMoreCommits } from '../../../../util/messages'
import { ExperimentsState } from '../../../../store'

interface CommitsNavigationProps {
  branch: string
}

export const CommitsNavigation: React.FC<CommitsNavigationProps> = ({
  branch
}) => {
  const { hasMoreCommits, isShowingMoreCommits } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  return (
    <div className={styles.commitsNav}>
      <CommitsButton
        type={CommitsButtonType.MORE}
        action={() => showMoreCommits(branch)}
        disabled={!hasMoreCommits[branch]}
      />
      <CommitsButton
        type={CommitsButtonType.LESS}
        action={() => showLessCommits(branch)}
        disabled={!isShowingMoreCommits[branch]}
      />
    </div>
  )
}
