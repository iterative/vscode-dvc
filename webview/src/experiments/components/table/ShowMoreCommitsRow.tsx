import cx from 'classnames'
import React from 'react'
import { useSelector } from 'react-redux'
import { showMoreCommits } from './messages'
import styles from './styles.module.scss'
import { IconButton } from '../../../shared/components/button/IconButton'
import { Refresh } from '../../../shared/components/icons'
import { ExperimentsState } from '../../store'

interface ShowMoreCommitsRowProps {
  colSpan: number
}

export const ShowMoreCommitsRow: React.FC<ShowMoreCommitsRowProps> = ({
  colSpan
}) => {
  const hasMoreCommits = useSelector(
    (state: ExperimentsState) => state.tableData.hasMoreCommits
  )

  return hasMoreCommits ? (
    <tbody>
      <tr className={cx(styles.tr, styles.previousCommitsRow)}>
        <td className={styles.th}>
          <IconButton
            icon={Refresh}
            text="Show More Commits"
            onClick={showMoreCommits}
          />
        </td>
        <td className={styles.th} colSpan={colSpan}></td>
      </tr>
    </tbody>
  ) : null
}
