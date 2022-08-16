import {
  TemplatePlotEntry,
  TemplatePlotGroup,
  TemplatePlotSection
} from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useEffect, useRef } from 'react'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { AddedSection } from './AddedSection'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import { removeFromPreviousAndAddToNewSection } from './util'
import { sendMessage } from '../../../shared/vscode'
import { createIDWithIndex, getIDIndex } from '../../../util/ids'
import styles from '../styles.module.scss'
import { shouldUseVirtualizedGrid } from '../util'
import { useNbItemsPerRow } from '../../hooks/useNbItemsPerRow'
import { PlotsState } from '../../store'
import { plotDataStore } from '../plotDataStore'
import { setDraggedOverGroup } from '../../../shared/components/dragDrop/dragDropSlice'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { reorderObjectList } from 'dvc/src/util/array'
import { isSameGroup } from '../../../shared/components/dragDrop/DragDropContainer'

export enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

export const TemplatePlots: React.FC = () => {
  const { plotsSnapshot, size } = useSelector(
    (state: PlotsState) => state.template
  )
  const draggedOverGroup = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedOverGroup
  )
  const draggedRef = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef
  )
  const [sections, setSections] = useState<TemplatePlotSection[]>([])
  const [hoveredSection, setHoveredSection] = useState('')
  const nbItemsPerRow = useNbItemsPerRow(size)
  const shouldSendMessage = useRef(true)
  const dispatch = useDispatch()

  useEffect(() => {
    shouldSendMessage.current = false
    setSections(plotDataStore.template)
  }, [plotsSnapshot, setSections])

  useEffect(() => {
    if (sections && shouldSendMessage.current) {
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

  if (!sections || sections.length === 0) {
    return <EmptyState isFullScreen={false}>No Plots to Display</EmptyState>
  }

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
    if (!draggedRef) {
      return
    }
    const draggedSectionId = getIDIndex(draggedRef.group)
    const draggedId = draggedRef.itemId

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
    position?: number
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

  const handleEnteringSection = (groupId: string) => {
    dispatch(setDraggedOverGroup(groupId))
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

        const classes = cx(styles.sectionWrapper, {
          [styles.multiViewPlotsGrid]: isMultiView,
          [styles.singleViewPlotsGrid]: !isMultiView,
          [styles.noBigGrid]: !useVirtualizedGrid
        })

        const handleDropAtTheEnd = () => {
          handleEnteringSection('')
          if (!draggedRef) {
            return
          }
          const isExactGroup = draggedRef.group === groupId
          const isSimilarGroup = isSameGroup(draggedRef.group, groupId)

          if (isExactGroup) {
            const order = section.entries.map(s => s.id)
            const draggedIndex = parseInt(draggedRef.itemIndex, 10)
            order.splice(draggedIndex, 1)
            order.push(draggedRef.itemId)
            const updatedSections = [...sections]
            updatedSections[i] = {
              ...sections[i],
              entries: reorderObjectList<TemplatePlotEntry>(
                order,
                section.entries,
                'id'
              )
            }
            setSections(updatedSections)
          } else if (isSimilarGroup) {
            const dropSectionLength = section.entries.length
            handleDropInSection(
              draggedRef.itemId,
              draggedRef.group,
              groupId,
              dropSectionLength
            )
          }
        }

        return (
          section.entries.length > 0 && (
            <div
              key={groupId}
              id={groupId}
              data-testid={`plots-section_${groupId}`}
              className={classes}
              onDragEnter={() => handleEnteringSection(groupId)}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onDropCapture={handleDropAtTheEnd}
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
                parentDraggedOver={draggedOverGroup === groupId}
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
