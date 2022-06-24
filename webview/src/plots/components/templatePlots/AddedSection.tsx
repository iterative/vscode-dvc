import React, { DragEvent } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { TemplatePlotSection } from 'dvc/src/plots/webview/contract'
import styles from '../styles.module.scss'
import { getIDWithoutIndex } from '../../../util/ids'
import { RootState } from '../../store'
import { Icon } from '../../../shared/components/Icon'
import { GraphLine } from '../../../shared/components/icons'

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
  const { draggedRef } = useSelector((state: RootState) => state.dragAndDrop)
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
    <div className={cx(styles.singleViewPlotsGrid, styles.noBigGrid)}>
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
            icon={GraphLine}
            className={styles.dropIcon}
            width={50}
            height={50}
          />
        )}
      </div>
    </div>
  )
}
