import {
  PlotsGroup,
  PlotSection,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useEffect, useRef } from 'react'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import { removeFromPreviousAndAddToNewSection } from './utils'
import { AddedSection } from './AddedSection'
import { DraggedInfo } from '../../../shared/components/dragDrop/DragDropContainer'
import { createIDWithIndex, getIDIndex } from '../../../util/ids'
import styles from '../styles.module.scss'

interface TemplatePlotsProps {
  plots: PlotSection[]
}

export enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

export const TemplatePlots: React.FC<TemplatePlotsProps> = ({ plots }) => {
  const [sections, setSections] = useState<PlotSection[]>([])
  const [hoveredSection, setHoveredSection] = useState('')
  const draggedRef = useRef<DraggedInfo>()

  useEffect(() => {
    setSections(plots)
  }, [plots, setSections])

  const firstSection = sections[0]
  const lastSection = sections.slice(-1)[0]

  if (!firstSection || !lastSection) {
    return null
  }

  const handleDropInNewSection = (e: DragEvent<HTMLElement>) => {
    const draggedSectionId = getIDIndex(e.dataTransfer.getData('group'))
    const draggedId = e.dataTransfer.getData('itemId')

    const updatedSections = removeFromPreviousAndAddToNewSection(
      sections,
      draggedSectionId,
      draggedId
    )

    const { group, entries } = sections[draggedSectionId]

    setHoveredSection('')
    const entry = entries.find(
      ({ id }) => id === draggedId
    ) as TemplatePlotEntry
    const newSection = {
      entries: [entry],
      group
    }

    if (e.currentTarget.id === NewSectionBlock.TOP) {
      if (firstSection.group !== group) {
        setSections([newSection, ...updatedSections])
      }
      return
    }
    if (lastSection.group !== group) {
      setSections([...updatedSections, newSection])
    }
  }

  const handleDropInSection = (
    draggedId: string,
    draggedGroup: string,
    groupId: string
  ) => {
    if (draggedGroup === groupId) {
      return
    }
    const oldGroupId = getIDIndex(draggedGroup)
    const newGroupId = getIDIndex(groupId)
    const entry = sections[oldGroupId].entries.find(
      ({ id }) => id === draggedId
    ) as TemplatePlotEntry
    const updatedSections = removeFromPreviousAndAddToNewSection(
      sections,
      oldGroupId,
      draggedId,
      newGroupId,
      entry
    )

    setSections(updatedSections)
  }

  const newDropSection = {
    draggedRef,
    hoveredSection,
    onDrop: handleDropInNewSection,
    setHoveredSection
  }

  return (
    <div>
      <AddedSection
        {...newDropSection}
        id={NewSectionBlock.TOP}
        closestSection={firstSection}
      />
      {sections.map((section, i) => {
        const groupId = createIDWithIndex(section.group, i)

        return (
          <div
            key={groupId}
            id={groupId}
            data-testid={`plots-section_${groupId}`}
            className={
              section.group === PlotsGroup.MULTI_VIEW
                ? styles.multiViewPlotsGrid
                : styles.singleViewPlotsGrid
            }
          >
            <TemplatePlotsGrid
              entries={section.entries}
              group={groupId}
              onDropInSection={handleDropInSection}
              draggedRef={draggedRef}
              multiView={section.group === PlotsGroup.MULTI_VIEW}
            />
          </div>
        )
      })}
      <AddedSection
        {...newDropSection}
        id={NewSectionBlock.BOTTOM}
        closestSection={lastSection}
      />
    </div>
  )
}
