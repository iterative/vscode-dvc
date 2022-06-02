import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { RibbonBlock } from './RibbonBlock'
import { sendMessage } from '../../../shared/vscode'
import { RootState } from '../../store'

export const Ribbon: React.FC = () => {
  const revisions = useSelector(
    (state: RootState) => state.comparison.revisions
  )
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
