import React, { DragEvent } from 'react'
import cx from 'classnames'
import { TemplatePlotGroup } from 'dvc/src/plots/webview/contract'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import { PlotGroup } from './templatePlotsSlice'
import styles from '../styles.module.scss'
import { shouldUseVirtualizedGrid } from '../util'
import { DraggedInfo } from '../../../shared/components/dragDrop/dragDropSlice'
import { isSameGroup } from '../../../shared/components/dragDrop/util'
import { createIDWithIndex } from '../../../util/ids'
import { changeOrderWithDraggedInfo } from '../../../util/array'

interface TemplatePlotGroupsProps {
  draggedRef: DraggedInfo
  draggedOverGroup: string
  handleDropInSection: (
    draggedId: string,
    draggedGroup: string,
    groupId: string,
    position?: number
  ) => void
  handleEnteringSection: (groupId: string) => void
  nbItemsPerRow: number
  sections: PlotGroup[]
  setSectionEntries: (index: number, entries: string[]) => void
  setSections: (sections: PlotGroup[]) => void
}

export const TemplatePlotGroups: React.FC<TemplatePlotGroupsProps> = ({
  draggedOverGroup,
  draggedRef,
  handleDropInSection,
  handleEnteringSection,
  nbItemsPerRow,
  sections,
  setSectionEntries,
  setSections
}) => {
  const handleDragOver = (e: DragEvent, groupId: string) => {
    e.preventDefault()
    handleEnteringSection(groupId)
  }

  const handleDropAtTheEnd = (groupId: string, order: string[], i: number) => {
    handleEnteringSection('')
    if (!draggedRef) {
      return
    }

    if (draggedRef.group === groupId) {
      const updatedSections = [...sections]

      const newOrder = changeOrderWithDraggedInfo(order, draggedRef)
      updatedSections[i] = {
        ...sections[i],
        entries: newOrder
      }
      setSections(updatedSections)
    } else if (isSameGroup(draggedRef.group, groupId)) {
      handleDropInSection(
        draggedRef.itemId,
        draggedRef.group,
        groupId,
        order.length
      )
    }
  }

  return sections.map((section, i) => {
    const groupId = createIDWithIndex(section.group, i)
    const useVirtualizedGrid = shouldUseVirtualizedGrid(
      Object.keys(section.entries).length,
      nbItemsPerRow
    )

    const isMultiView = section.group === TemplatePlotGroup.MULTI_VIEW

    const classes = cx(styles.sectionWrapper, {
      [styles.multiViewPlotsGrid]: isMultiView,
      [styles.singleViewPlotsGrid]: !isMultiView,
      [styles.noBigGrid]: !useVirtualizedGrid
    })

    return (
      <div
        key={groupId}
        id={groupId}
        data-testid={`plots-section_${groupId}`}
        className={classes}
        onDragEnter={() => handleEnteringSection(groupId)}
        onDragOver={e => handleDragOver(e, groupId)}
        onDrop={() => handleDropAtTheEnd(groupId, section.entries, i)}
      >
        <TemplatePlotsGrid
          groupId={groupId}
          groupIndex={i}
          multiView={isMultiView}
          setSectionEntries={setSectionEntries}
          useVirtualizedGrid={useVirtualizedGrid}
          nbItemsPerRow={nbItemsPerRow}
          parentDraggedOver={
            draggedOverGroup === groupId || draggedRef?.group === groupId
          }
          onDropInSection={handleDropInSection}
        />
      </div>
    )
  })
}
