import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'

interface EmptyStateProps {
  isFullScreen?: boolean
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
      <p className={styles.emptyStateText}>{children}</p>
    </div>
  )
}
