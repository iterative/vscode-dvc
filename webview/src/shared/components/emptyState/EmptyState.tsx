import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'

interface EmptyStateProps {
  isFullScreen?: boolean
  children: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  children,
  isFullScreen = true
}) => {
  return (
    <div
      className={cx(
        'centered',
        isFullScreen ? styles.emptyScreen : styles.emptySection
      )}
    >
      <div className={styles.emptyStateText}>{children}</div>
    </div>
  )
}
