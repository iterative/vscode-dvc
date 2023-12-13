import React, { DragEvent } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { TemplatePlotGroup } from 'dvc/src/plots/webview/contract'
import { PlotGroup } from './templatePlotsSlice'
import styles from '../styles.module.scss'
import { PlotsState } from '../../store'
import { getIDWithoutIndex } from '../../../util/ids'
import { Icon } from '../../../shared/components/Icon'
import { GraphLine } from '../../../shared/components/icons'
import { useDeferredDragLeave } from '../../../shared/hooks/useDeferredDragLeave'

interface AddedSectionProps {
  id: string
  hoveredSection: string
  setHoveredSection: (section: string) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  closestSection: PlotGroup
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
  const { draggedRef } = useSelector((state: PlotsState) => state.dragAndDrop)
  const { immediateDragEnter, deferredDragLeave } = useDeferredDragLeave()

  const isHovered = hoveredSection === id

  const handleDragLeave = () => {
    deferredDragLeave(() => setHoveredSection(''))
  }

  const handleDragEnter = () => {
    const draggedGroup = getIDWithoutIndex(draggedRef?.group) || ''
    if (
      acceptedGroups.includes(draggedGroup) &&
      (draggedGroup as TemplatePlotGroup) !== closestSection.group
    ) {
      setHoveredSection(id)
      immediateDragEnter()
    }
  }

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    immediateDragEnter()
  }

  return (
    <div
      id={id}
      data-testid={id}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={onDrop}
      draggable
      className={cx(
        styles.singleViewPlotsGrid,
        styles.noBigGrid,
        styles.dropSectionWrapper
      )}
    >
      <div
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
