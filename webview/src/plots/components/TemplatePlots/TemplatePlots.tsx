import {
  TemplatePlotGroup,
  TemplatePlotSection,
  TemplatePlotEntry
} from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useEffect, useRef } from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import { removeFromPreviousAndAddToNewSection } from './utils'
import { AddedSection } from './AddedSection'
import { DraggedInfo } from '../../../shared/components/dragDrop/DragDropContainer'
import { createIDWithIndex, getIDIndex } from '../../../util/ids'
import styles from '../styles.module.scss'
import { sendMessage } from '../../../shared/vscode'

interface TemplatePlotsProps {
  plots: TemplatePlotSection[]
}

export enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

export const TemplatePlots: React.FC<TemplatePlotsProps> = ({ plots }) => {
  const [sections, setSections] = useState<TemplatePlotSection[]>([])
  const [hoveredSection, setHoveredSection] = useState('')
  const draggedRef = useRef<DraggedInfo>()

  useEffect(() => {
    setSections(plots)
  }, [plots, setSections])

  const setSectionOrder = (sections: TemplatePlotSection[]): void => {
    setSections(sections)
    sendMessage({
      payload: sections.map(section => ({
        group: section.group,
        paths: section.entries.map(({ id }) => id)
      })),
      type: MessageFromWebviewType.PLOTS_TEMPLATES_REORDERED
    })
  }

  const setSectionEntries = (index: number, entries: TemplatePlotEntry[]) => {
    sections[index] = {
      ...sections[index],
      entries
    }

    setSectionOrder(sections)
  }

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
        setSectionOrder([newSection, ...updatedSections])
      }
      return
    }
    if (lastSection.group !== group) {
      setSectionOrder([...updatedSections, newSection])
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

    setSectionOrder(updatedSections)
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
          section.entries.length > 0 && (
            <div
              key={groupId}
              id={groupId}
              data-testid={`plots-section_${groupId}`}
              className={
                section.group === TemplatePlotGroup.MULTI_VIEW
                  ? styles.multiViewPlotsGrid
                  : styles.singleViewPlotsGrid
              }
            >
              <TemplatePlotsGrid
                entries={section.entries}
                groupId={groupId}
                groupIndex={i}
                onDropInSection={handleDropInSection}
                draggedRef={draggedRef}
                multiView={section.group === TemplatePlotGroup.MULTI_VIEW}
                setSectionEntries={setSectionEntries}
              />
            </div>
          )
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
