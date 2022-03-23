import React, { DragEvent, MutableRefObject } from 'react'
import cx from 'classnames'
import { PlotSection } from './utils'
import styles from '../styles.module.scss'
import { getIDWithoutIndex } from '../../../util/ids'
import { DraggedInfo } from '../../../shared/components/dragDrop/DragDropContainer'
import { AllIcons, Icon } from '../../../shared/components/icon/Icon'

interface AddedSectionProps {
  id: string
  hoveredSection: string
  setHoveredSection: (section: string) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  closestSection: PlotSection
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

  const isHovered = hoveredSection === id

  return (
    <div className={styles.singleViewPlotsGrid}>
      <div
        id={id}
        data-testid={id}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e: DragEvent<HTMLElement>) => e.preventDefault()}
        onDrop={onDrop}
        className={cx(styles.dropSection, {
          [styles.dropSectionMaximized]: isHovered,
          [styles.plot]: isHovered
        })}
      >
        {isHovered && (
          <Icon
            data-testid={`${id}_drop-icon`}
            icon={AllIcons.DOWN_ARROW}
            className={styles.dropIcon}
            width={50}
            height={50}
          />
        )}
      </div>
    </div>
  )
}
