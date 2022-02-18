import cx from 'classnames'
import React from 'react'
import styles from './styles.module.scss'
import { Pin } from '../../../shared/components/icons'

export interface ComparisonTableHeaderProps {
  displayColor: string
  onClicked: () => void
  isPinned?: boolean
}

export const ComparisonTableHeader: React.FC<ComparisonTableHeaderProps> = ({
  displayColor,
  children,
  onClicked,
  isPinned
}) => {
  const pinClasses = cx(styles.pin, {
    [styles.pinned]: isPinned
  })

  return (
    <button className={styles.header} onClick={onClicked}>
      <div className={pinClasses}>
        <Pin />
      </div>
      <span
        className={styles.bullet}
        style={{ backgroundColor: displayColor }}
      />
      {children}
    </button>
  )
}
