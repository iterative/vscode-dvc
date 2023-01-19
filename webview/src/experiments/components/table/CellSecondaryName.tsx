import React from 'react'
import { VSCodeTag } from '@vscode/webview-ui-toolkit/react'
import { CommitData } from 'dvc/src/experiments/webview/contract'
import styles from './styles.module.scss'
import Tooltip from '../../../shared/components/tooltip/Tooltip'
import { Icon } from '../../../shared/components/Icon'
import { GitCommit } from '../../../shared/components/icons'

export const CellSecondaryName: React.FC<{
  displayNameOrParent: string
  commit?: CommitData
  sha?: string
}> = ({ displayNameOrParent, commit, sha }) => {
  const children = (
    <span className={styles.experimentCellSecondaryName}>
      {commit && <Icon width={10} height={10} icon={GitCommit} />}{' '}
      {displayNameOrParent}
    </span>
  )
  if (!commit) {
    return children
  }

  const { tags, author, message, date } = commit
  const tooltipContent = (
    <div className={styles.experimentCellSecondaryNameTooltip}>
      <div>
        <p className={styles.sha}>
          <Icon width={14} height={14} icon={GitCommit} /> {sha?.slice(0, 7)}
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

  return (
    <Tooltip
      placement="bottom-start"
      appendTo={document.body}
      content={tooltipContent}
      interactive
    >
      {children}
    </Tooltip>
  )
}
