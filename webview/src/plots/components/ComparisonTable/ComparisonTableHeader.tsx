import cx from 'classnames'
import React, { KeyboardEvent } from 'react'
import styles from './styles.module.scss'
import { Pin } from '../../../shared/components/icons'

interface ComparisonTableHeaderProps {
  color: string
  onClicked: () => void
  index: number
  isPinned?: boolean
}

export const ComparisonTableHeader: React.FC<ComparisonTableHeaderProps> = ({
  children,
  color,
  onClicked,
  index,
  isPinned
}) => {
  const pinClasses = cx(styles.pin, {
    [styles.pinned]: isPinned
  })

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.key === 'Enter' && onClicked()
  }

  return (
    <div
      className={styles.header}
      onClick={onClicked}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={index}
    >
      <div className={pinClasses}>
        <Pin />
      </div>
      <span className={styles.bullet} style={{ backgroundColor: color }} />
      {children}
    </div>
  )
}
