import {
  TemplatePlotEntry,
  TemplatePlotGroup,
  TemplatePlotSection
} from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useEffect, useRef } from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { AddedSection } from './AddedSection'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import { removeFromPreviousAndAddToNewSection } from './util'
import { getTemplatePlots } from './templatePlotsSlice'
import { sendMessage } from '../../../shared/vscode'
import { createIDWithIndex, getIDIndex } from '../../../util/ids'
import styles from '../styles.module.scss'
import { shouldUseVirtualizedGrid } from '../util'
import { useNbItemsPerRow } from '../../hooks/useNbItemsPerRow'
import { RootState } from '../../store'

export enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

export const TemplatePlots: React.FC = () => {
  const { size } = useSelector((state: RootState) => state.template)
  const plots = useSelector(getTemplatePlots)
  const [sections, setSections] = useState<TemplatePlotSection[]>([])
  const [hoveredSection, setHoveredSection] = useState('')
  const nbItemsPerRow = useNbItemsPerRow(size)
  const shouldSendMessage = useRef(true)

  useEffect(() => {
    shouldSendMessage.current = false
    setSections(plots)
  }, [plots, setSections])

  useEffect(() => {
    if (shouldSendMessage.current) {
      sendMessage({
        payload: sections.map(section => ({
          group: section.group,
          paths: section.entries.map(({ id }) => id)
        })),
        type: MessageFromWebviewType.REORDER_PLOTS_TEMPLATES
      })
    }
    shouldSendMessage.current = true
  }, [sections])

  const setSectionEntries = (index: number, entries: TemplatePlotEntry[]) => {
    setSections(sections => {
      const updatedSections = [...sections]
      updatedSections[index] = {
        ...sections[index],
        entries
      }
      return updatedSections
    })
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
        setTimeout(() => setSections([newSection, ...updatedSections]), 1)
      }
      return
    }
    if (lastSection.group !== group) {
      setTimeout(() => setSections([...updatedSections, newSection]), 1)
    }
  }

  const handleDropInSection = (
    draggedId: string,
    draggedGroup: string,
    groupId: string,
    position: number
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
      entry,
      position
    )

    setSections(updatedSections)
  }

  const newDropSection = {
    acceptedGroups: Object.values(TemplatePlotGroup),
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
        const useVirtualizedGrid = shouldUseVirtualizedGrid(
          Object.keys(section.entries).length,
          size
        )

        const isMultiView = section.group === TemplatePlotGroup.MULTI_VIEW

        const classes = cx({
          [styles.multiViewPlotsGrid]: isMultiView,
          [styles.singleViewPlotsGrid]: !isMultiView,
          [styles.noBigGrid]: !useVirtualizedGrid
        })

        return (
          section.entries.length > 0 && (
            <div
              key={groupId}
              id={groupId}
              data-testid={`plots-section_${groupId}`}
              className={classes}
            >
              <TemplatePlotsGrid
                entries={section.entries}
                groupId={groupId}
                groupIndex={i}
                onDropInSection={handleDropInSection}
                multiView={isMultiView}
                setSectionEntries={setSectionEntries}
                useVirtualizedGrid={useVirtualizedGrid}
                nbItemsPerRow={nbItemsPerRow}
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
