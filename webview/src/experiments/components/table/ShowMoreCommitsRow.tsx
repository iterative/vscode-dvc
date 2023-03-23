import React from 'react'
import { useSelector } from 'react-redux'
import { showMoreCommits } from './messages'
import styles from './styles.module.scss'
import { IconButton } from '../../../shared/components/button/IconButton'
import { Refresh } from '../../../shared/components/icons'
import { ExperimentsState } from '../../store'

export const ShowMoreCommitsRow: React.FC = () => {
  const hasMoreCommits = useSelector(
    (state: ExperimentsState) => state.tableData.hasMoreCommits
  )

  return hasMoreCommits ? (
    <div className={styles.showMoreCommits} data-testid="show-more-commits">
      <IconButton
        icon={Refresh}
        text="Show More Commits"
        onClick={showMoreCommits}
      />
    </div>
  ) : null
}
