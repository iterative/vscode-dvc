import React from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { showLessCommits, showMoreCommits } from '../../../../util/messages'
import { ExperimentsState } from '../../../../store'
import { Icon } from '../../../../../shared/components/Icon'
import { Add, Remove } from '../../../../../shared/components/icons'
import Tooltip from '../../../../../shared/components/tooltip/Tooltip'

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
      <Tooltip content={<>Show More Commits</>}>
        <button
          className={styles.commitsButton}
          onClick={() => showMoreCommits(branch)}
          disabled={!hasMoreCommits[branch]}
          aria-label="Show More Commits"
        >
          <Icon icon={Add} className={styles.commitsIcon} />
        </button>
      </Tooltip>
      <Tooltip content={<>Show Less Commits</>}>
        <button
          className={styles.commitsButton}
          onClick={() => showLessCommits(branch)}
          disabled={!isShowingMoreCommits[branch]}
          aria-label="Show Less Commits"
        >
          <Icon icon={Remove} className={styles.commitsIcon} />
        </button>
      </Tooltip>
    </div>
  )
}
