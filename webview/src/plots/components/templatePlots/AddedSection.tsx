import React, { DragEvent, useContext } from 'react'
import cx from 'classnames'
import { TemplatePlotSection } from 'dvc/src/plots/webview/contract'
import styles from '../styles.module.scss'
import { getIDWithoutIndex } from '../../../util/ids'
import { AllIcons, Icon } from '../../../shared/components/Icon'
import { DragDropContext } from '../../../shared/components/dragDrop/DragDropContext'

interface AddedSectionProps {
  id: string
  hoveredSection: string
  setHoveredSection: (section: string) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  closestSection: TemplatePlotSection
  acceptedGroups: string[]
}

export const AddedSection: React.FC<AddedSectionProps> = ({
  id,
  onDrop,
  hoveredSection,
  setHoveredSection,
  closestSection,
  acceptedGroups
}) => {
  const { draggedRef } = useContext(DragDropContext)
  const handleDragLeave = () => {
    setHoveredSection('')
  }

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    const draggedGroup = getIDWithoutIndex(draggedRef?.group) || ''
    if (
      acceptedGroups.includes(draggedGroup) &&
      draggedGroup !== closestSection.group
    ) {
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
            icon={AllIcons.GRAPH_LINE}
            className={styles.dropIcon}
            width={50}
            height={50}
          />
        )}
      </div>
    </div>
  )
}
