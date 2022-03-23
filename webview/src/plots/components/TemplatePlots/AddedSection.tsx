import React, { DragEvent, MutableRefObject } from 'react'
import cx from 'classnames'
import { TemplatePlotSection } from 'dvc/src/plots/webview/contract'
import styles from '../styles.module.scss'
import { getIDWithoutIndex } from '../../../util/ids'
import { DraggedInfo } from '../../../shared/components/dragDrop/DragDropContainer'

interface AddedSectionProps {
  id: string
  hoveredSection: string
  setHoveredSection: (section: string) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  closestSection: TemplatePlotSection
  draggedRef: MutableRefObject<DraggedInfo | undefined>
}

export const AddedSection: React.FC<AddedSectionProps> = ({
  id,
  onDrop,
  hoveredSection,
  setHoveredSection,
  closestSection,
  draggedRef
}) => {
  const handleDragLeave = () => {
    setHoveredSection('')
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    const draggedGroup = getIDWithoutIndex(draggedRef.current?.group)
    if (draggedGroup !== closestSection.group) {
      setHoveredSection(e.currentTarget.id)
    }
  }

  return (
    <div
      id={id}
      data-testid={id}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e: DragEvent<HTMLElement>) => e.preventDefault()}
      onDrop={onDrop}
      className={cx(styles.dropSection, {
        [styles.dropSectionMaximized]: hoveredSection === id
      })}
    />
  )
}
