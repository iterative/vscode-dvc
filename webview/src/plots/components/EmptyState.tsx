import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'

export const EmptyState = (text: string, isFullScreen = true) => {
  return (
    <div
      className={cx(
        styles.centered,
        isFullScreen ? styles.emptyScreen : styles.emptySection
      )}
    >
      <p className={styles.emptyStateText}>{text}</p>
    </div>
  )
}
