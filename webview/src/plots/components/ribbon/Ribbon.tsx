import { Revision } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import styles from './styles.module.scss'
import { RibbonBlock } from './RibbonBlock'
import { sendMessage } from '../../../shared/vscode'
import { AllIcons } from '../../../shared/components/Icon'
import { IconButton } from '../../../shared/components/button/IconButton'

interface RibbonProps {
  revisions: Revision[]
}

const MAX_NB_EXP = 7

export const Ribbon: React.FC<RibbonProps> = ({ revisions }) => {
  const removeRevision = (revision: string) => {
    sendMessage({
      payload: revision,
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT
    })
  }

  const selectRevisions = () => {
    sendMessage({
      type: MessageFromWebviewType.SELECT_EXPERIMENTS
    })
  }

  return (
    <ul className={styles.list} data-testid="ribbon">
      <li className={styles.addButtonWrapper}>
        <IconButton
          onClick={selectRevisions}
          icon={AllIcons.LINES}
          text={`${revisions.length} of ${MAX_NB_EXP}`}
        />
      </li>
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
