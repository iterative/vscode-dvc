import cx from 'classnames'
import React, { useState, KeyboardEvent } from 'react'
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
  const [isHovered, setIsHovered] = useState(false)
  const pinClasses = cx(styles.pin, {
    [styles.pinned]: isPinned,
    [styles.hoveredPin]: isHovered
  })

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.key === 'Enter' && onClicked()
  }

  return (
    <div
      className={styles.header}
      onClick={onClicked}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
