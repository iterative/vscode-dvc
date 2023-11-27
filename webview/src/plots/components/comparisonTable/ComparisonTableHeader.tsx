import cx from 'classnames'
import React, { MouseEvent } from 'react'
import styles from './styles.module.scss'
import { Pinned } from '../../../shared/components/icons'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'

export interface ComparisonTableHeaderProps {
  displayColor: string
  onClicked: () => void
  isPinned?: boolean
  children?: React.ReactNode
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
    <div
      className={styles.header}
      data-testid={`${
        children?.toString().split(',')[0] || 'no-children'
      }-header`}
    >
      {!isPinned && <GripIcon className={styles.gripIcon} />}
      <button
        className={pinClasses}
        onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
        onClick={onClicked}
      >
        <Pinned />
      </button>
      <span
        className={styles.bullet}
        style={{ backgroundColor: displayColor }}
      />
      <span className={styles.headerText}>{children}</span>
    </div>
  )
}
