import React from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { CommitsButton, CommitsButtonProps } from './CommitsButton'
import { showLessCommits, showMoreCommits } from '../../../../util/messages'
import { ExperimentsState } from '../../../../store'
import { Add, Remove } from '../../../../../shared/components/icons'
interface CommitsNavigationProps {
  branch: string
}

export const CommitsNavigation: React.FC<CommitsNavigationProps> = ({
  branch
}) => {
  const { hasMoreCommits, isShowingMoreCommits } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  const commitsButtons: { [key: string]: CommitsButtonProps } = {
    LESS: {
      action: () => showLessCommits(branch),
      disabled: !isShowingMoreCommits[branch],
      icon: Remove,
      moreOrLess: 'Less'
    },
    MORE: {
      action: () => showMoreCommits(branch),
      disabled: !hasMoreCommits[branch],
      icon: Add,
      moreOrLess: 'More'
    }
  }

  return (
    <div className={styles.commitsNav}>
      {Object.values(commitsButtons).map(commitButton => (
        <CommitsButton key={commitButton.moreOrLess} {...commitButton} />
      ))}
    </div>
  )
}
