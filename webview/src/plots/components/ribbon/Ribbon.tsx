import { Revision } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import styles from './styles.module.scss'
import { RibbonBlock } from './RibbonBlock'
import { sendMessage } from '../../../shared/vscode'

interface RibbonProps {
  revisions: Revision[]
}

export const Ribbon: React.FC<RibbonProps> = ({ revisions }) => {
  const removeRevision = (revision: string) => {
    sendMessage({
      payload: revision,
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT
    })
  }
  return (
    <ul className={styles.list} data-testid="ribbon">
      {revisions.map(revision => (
        <RibbonBlock
          revision={revision}
          key={revision.revision}
          onClear={() => removeRevision(revision.id || '')}
        />
      ))}
    </ul>
  )
}
