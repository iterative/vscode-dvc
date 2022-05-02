import cx from 'classnames'
import React from 'react'
import styles from './styles.module.scss'
import { Pin } from '../../../shared/components/icons'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'

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
    <div className={styles.header}>
      {!isPinned && <GripIcon className={styles.gripIcon} />}
      <button className={pinClasses} onClick={onClicked}>
        <Pin />
      </button>
      <span
        className={styles.bullet}
        style={{ backgroundColor: displayColor }}
      />
      {children}
    </div>
  )
}
