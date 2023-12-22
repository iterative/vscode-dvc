import React from 'react'
import cx from 'classnames'
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'

export const RevisionIcon: React.FC<{
  fetched: boolean
}> = ({ fetched }) => (
  <div className={styles.iconPlaceholder}>
    {!fetched && (
      <VSCodeProgressRing className={cx(styles.fetching, 'chromatic-ignore')} />
    )}
  </div>
)
