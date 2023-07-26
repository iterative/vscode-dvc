import React from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { CommitsButton, CommitsButtonProps } from './CommitsButton'
import {
  resetCommits,
  showLessCommits,
  showMoreCommits
} from '../../../../util/messages'
import { ExperimentsState } from '../../../../store'
import { Add, Discard, Remove } from '../../../../../shared/components/icons'
interface CommitsNavigationProps {
  branch: string
}

export const CommitsNavigation: React.FC<CommitsNavigationProps> = ({
  branch
}) => {
  const { hasMoreCommits, isShowingMoreCommits } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  const getMoreOrLessValues = (
    moreOrLess: 'More' | 'Less'
  ): { key: string; tooltipContent: string } => ({
    key: moreOrLess,
    tooltipContent: `Show ${moreOrLess} Commits`
  })

  const commitsButtons: (CommitsButtonProps & { key: string })[] = [
    {
      action: () => showMoreCommits(branch),
      disabled: !hasMoreCommits[branch],
      icon: Add,
      ...getMoreOrLessValues('More')
    },
    {
      action: () => showLessCommits(branch),
      disabled: !isShowingMoreCommits[branch],
      icon: Remove,
      ...getMoreOrLessValues('Less')
    },
    {
      action: () => resetCommits(branch),
      disabled: false,
      icon: Discard,
      key: 'Reset',
      tooltipContent: 'Reset Commits to Default'
    }
  ]

  return (
    <div className={styles.commitsNav}>
      {commitsButtons.map(commitButton => {
        const { key, ...commitButtonProps } = commitButton
        return <CommitsButton key={key} {...commitButtonProps} />
      })}
    </div>
  )
}
