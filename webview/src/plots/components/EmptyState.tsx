import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'

export const EmptyState = (text: string) => {
  return (
    <div className={cx(styles.centered, styles.fullScreen)}>
      <p className={styles.emptyStateText}>{text}</p>
    </div>
  )
}
