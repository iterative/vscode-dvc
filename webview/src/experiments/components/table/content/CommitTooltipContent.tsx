import React from 'react'
import { CommitData } from 'dvc/src/experiments/webview/contract'
import { VSCodeTag } from '@vscode/webview-ui-toolkit/react'
import styles from '../styles.module.scss'
import { Icon } from '../../../../shared/components/Icon'
import { GitCommit } from '../../../../shared/components/icons'

export const CommitTooltipContent: React.FC<{
  sha?: string
  commit: CommitData
}> = ({ sha, commit }) => {
  const { tags, author, message, date } = commit
  return (
    <div className={styles.experimentCellSecondaryNameTooltip}>
      <div>
        <p className={styles.sha}>
          <Icon width={16} height={16} icon={GitCommit} /> {sha?.slice(0, 7)}
        </p>
        {tags.length > 0 && (
          <>
            {tags.map(tag => (
              <VSCodeTag className={styles.tag} key={tag}>
                {tag}
              </VSCodeTag>
            ))}
          </>
        )}
      </div>
      <p>
        {author}, {date}
      </p>
      <p className={styles.message}>{message}</p>
    </div>
  )
}
