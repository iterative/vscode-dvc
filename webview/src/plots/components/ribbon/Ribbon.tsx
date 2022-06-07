import { Revision } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useState } from 'react'
import { reorderObjectList } from 'dvc/src/util/array'
import styles from './styles.module.scss'
import { RibbonBlock } from './RibbonBlock'
import { sendMessage } from '../../../shared/vscode'
import { AllIcons } from '../../../shared/components/Icon'
import { IconButton } from '../../../shared/components/button/IconButton'
import { performOrderedUpdate } from '../../../util/objects'

interface RibbonProps {
  revisions: Revision[]
}

const MAX_NB_EXP = 7

export const Ribbon: React.FC<RibbonProps> = ({ revisions }) => {
  const [order, setOrder] = useState<string[]>([])
  const reorderId = 'id'

  useEffect(() => {
    setOrder(pastOrder => performOrderedUpdate(pastOrder, revisions, reorderId))
  }, [revisions])

  const removeRevision = (revision: string) => {
    sendMessage({
      payload: revision,
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT
    })
  }

  const refreshRevisions = () =>
    sendMessage({
      payload: revisions.map(({ revision }) => revision),
      type: MessageFromWebviewType.REFRESH_REVISIONS
    })

  const selectRevisions = () => {
    sendMessage({
      type: MessageFromWebviewType.SELECT_EXPERIMENTS
    })
  }

  return (
    <ul className={styles.list} data-testid="ribbon">
      <li className={styles.buttonWrapper}>
        <IconButton
          onClick={selectRevisions}
          icon={AllIcons.LINES}
          text={`${revisions.length} of ${MAX_NB_EXP}`}
        />
      </li>
      <li className={styles.buttonWrapper}>
        <IconButton
          onClick={refreshRevisions}
          icon={AllIcons.REFRESH}
          text="Refresh All"
          appearance="secondary"
        />
      </li>
      {reorderObjectList(order, revisions, reorderId).map(revision => (
        <RibbonBlock
          revision={revision}
          key={revision.revision}
          onClear={() => removeRevision(revision.id || '')}
        />
      ))}
    </ul>
  )
}
