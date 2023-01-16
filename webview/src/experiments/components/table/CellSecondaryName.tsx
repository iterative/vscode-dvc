import React from 'react'
import { VSCodeTag } from '@vscode/webview-ui-toolkit/react'
import { CommitData } from 'dvc/src/experiments/webview/contract'
import styles from './styles.module.scss'
import Tooltip from '../../../shared/components/tooltip/Tooltip'

export const CellSecondaryName: React.FC<{
  displayNameOrParent: string
  commit?: CommitData
  sha?: string
}> = ({ displayNameOrParent, commit, sha }) => {
  const children = (
    <span className={styles.experimentCellSecondaryName}>
      {displayNameOrParent}
    </span>
  )
  if (!commit) {
    return children
  }

  const { tags, author, message } = commit
  const tooltipContent = (
    <div className={styles.experimentCellSecondaryNameTooltip}>
      <div>
        <p className={styles.sha}>{sha?.slice(0, 7)}</p>
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
      <p>Commit authored by {author}</p>
      <p className={styles.message}>{message}</p>
    </div>
  )

  return (
    <Tooltip
      placement="bottom-start"
      interactive
      appendTo={document.body}
      content={tooltipContent}
    >
      {children}
    </Tooltip>
  )
}
