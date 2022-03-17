import React, { DragEvent } from 'react'
import cx from 'classnames'
import styles from '../styles.module.scss'

type DragFunction = (e: DragEvent<HTMLElement>) => void

interface AddedSectionProps {
  id: string
  hoveredSection: string
  onDragEnter: DragFunction
  onDragLeave: DragFunction
  onDragOver: DragFunction
  onDrop: DragFunction
}

export const AddedSection: React.FC<AddedSectionProps> = ({
  id,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  hoveredSection
}) => {
  return (
    <div
      id={id}
      data-testid={id}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cx(styles.dropSection, {
        [styles.dropSectionMaximized]: hoveredSection === id
      })}
    />
  )
}
