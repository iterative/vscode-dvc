import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import React from 'react'
import cx from 'classnames'
import styles from '../styles.module.scss'

export const Progress: React.FC = () => (
  <VSCodeProgressRing className={cx(styles.running, 'chromatic-ignore')} />
)
