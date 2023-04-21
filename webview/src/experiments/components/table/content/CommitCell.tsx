import React from 'react'
import { CommitData } from 'dvc/src/experiments/webview/contract'
import { CommitTooltipContent } from './CommitTooltipContent'
import styles from '../styles.module.scss'
import Tooltip from '../../../../shared/components/tooltip/Tooltip'
import { Icon } from '../../../../shared/components/Icon'
import { GitCommit } from '../../../../shared/components/icons'

export const CommitCell: React.FC<{
  commit: CommitData
  description: string
  label: string
  sha?: string
}> = ({ commit, description, label, sha }) => {
  return (
    <Tooltip
      placement="bottom-start"
      appendTo={document.body}
      content={<CommitTooltipContent commit={commit} sha={sha} />}
    >
      <div className={styles.experimentCellText}>
        <span>{label}</span>
        <span className={styles.experimentCellSecondaryName}>
          <Icon width={14} height={14} icon={GitCommit} />{' '}
          <span>{description}</span>
        </span>
      </div>
    </Tooltip>
  )
}
