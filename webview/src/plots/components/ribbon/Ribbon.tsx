import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { useInView } from 'react-intersection-observer'
import styles from './styles.module.scss'
import { RibbonBlock } from './RibbonBlock'
import { sendMessage } from '../../../shared/vscode'
import { IconButton } from '../../../shared/components/button/IconButton'
import { PlotsState } from '../../store'
import { Lines, Refresh } from '../../../shared/components/icons'

const MAX_NB_EXP = 7

export const Ribbon: React.FC = () => {
  const [ref, needsShadow] = useInView({
    root: document.querySelector('#webview-wrapper'),
    rootMargin: '-5px',
    threshold: 0.95
  })

  const revisions = useSelector(
    (state: PlotsState) => state.webview.selectedRevisions
  )

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
    <ul
      ref={ref}
      data-testid="ribbon"
      className={cx(styles.list, needsShadow && styles.withShadow)}
    >
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
