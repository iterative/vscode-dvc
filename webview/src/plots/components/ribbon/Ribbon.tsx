import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { reorderObjectList } from 'dvc/src/util/array'
import styles from './styles.module.scss'
import { RibbonBlock } from './RibbonBlock'
import { sendMessage } from '../../../shared/vscode'
import { IconButton } from '../../../shared/components/button/IconButton'
import { performOrderedUpdate } from '../../../util/objects'
import { RootState } from '../../store'
import { Lines, Refresh } from '../../../shared/components/icons'

const MAX_NB_EXP = 7

export const Ribbon: React.FC = () => {
  const revisions = useSelector(
    (state: RootState) => state.webview.selectedRevisions
  )
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
          icon={Lines}
          text={`${revisions.length} of ${MAX_NB_EXP}`}
        />
      </li>
      <li className={styles.buttonWrapper}>
        <IconButton
          onClick={refreshRevisions}
          icon={Refresh}
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
