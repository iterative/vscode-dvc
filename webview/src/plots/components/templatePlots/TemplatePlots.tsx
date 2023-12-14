import { PlotsSection, TemplatePlotGroup } from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AddedSection } from './AddedSection'
import { NoPlotsToDisplay } from './NoPlotsToDisplay'
import { PlotGroup, updateSections } from './templatePlotsSlice'
import { removeFromPreviousAndAddToNewSection } from './util'
import { TemplatePlotGroups } from './TemplatePlotGroups'
import { TooManyPlots } from '../TooManyPlots'
import { getIDIndex } from '../../../util/ids'
import { PlotsState } from '../../store'
import { setDraggedOverGroup } from '../../../shared/components/dragDrop/dragDropSlice'
import { LoadingSection, sectionIsLoading } from '../LoadingSection'
import { reorderTemplatePlots } from '../../util/messages'
import { useObserveGridDimensions } from '../../hooks/useObserveGridDimensions'

export enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

export const TemplatePlots: React.FC = () => {
  const { nbItemsPerRow, sections, hasItems, shouldShowTooManyPlotsMessage } =
    useSelector((state: PlotsState) => state.template)

  const draggedOverGroup = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedOverGroup
  )
  const draggedRef = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef
  )
  const selectedRevisions = useSelector(
    (state: PlotsState) => state.webview.selectedRevisions
  )

  const gridRef = useRef<HTMLDivElement>(null)
  useObserveGridDimensions(PlotsSection.TEMPLATE_PLOTS, gridRef)

  const [hoveredSection, setHoveredSection] = useState('')
  const dispatch = useDispatch()

  const sendReorderMessage = useCallback((sections: PlotGroup[]) => {
    reorderTemplatePlots(sections)
  }, [])

  const setSections = useCallback(
    (sections: PlotGroup[]) => {
      /* Although the following dispatch duplicates the work the reducer will do when the state returns 
         from the extension, this is necessary to not see any flickering in the order as the returned state 
         sometimes takes a while to come back */
      dispatch(updateSections(sections))
      sendReorderMessage(sections)
    },
    [dispatch, sendReorderMessage]
  )

  const handleDropInSection = useCallback(
    (
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
      const updatedSections = removeFromPreviousAndAddToNewSection(
        sections,
        oldGroupId,
        draggedId,
        newGroupId,
        position
      )

      setSections(updatedSections)
    },
    [setSections, sections]
  )

  const setSectionEntries = useCallback(
    (index: number, entries: string[]) => {
      const updatedSections = [...sections]
      updatedSections[index] = {
        ...updatedSections[index],
        entries
      }
      setSections(updatedSections)
    },
    [setSections, sections]
  )

  if (sectionIsLoading(selectedRevisions, hasItems)) {
    return <LoadingSection />
  }

  if (!sections || sections.length === 0) {
    return <NoPlotsToDisplay />
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

    const { group } = sections[draggedSectionId]

    setHoveredSection('')
    const newSection = {
      entries: [draggedId],
      group
    }

    if ((e.currentTarget.id as NewSectionBlock) === NewSectionBlock.TOP) {
      if (firstSection.group !== group) {
        setTimeout(() => setSections([newSection, ...updatedSections]), 1)
      }
      return
    }
    if (lastSection.group !== group) {
      setTimeout(() => setSections([...updatedSections, newSection]), 1)
    }
  }

  const handleEnteringSection = (groupId: string) =>
    dispatch(setDraggedOverGroup(groupId))

  const newDropSection = {
    acceptedGroups: Object.values(TemplatePlotGroup),
    hoveredSection,
    onDrop: handleDropInNewSection,
    setHoveredSection
  }

  return (
    <div ref={gridRef}>
      <AddedSection
        {...newDropSection}
        id={NewSectionBlock.TOP}
        closestSection={firstSection}
      />

      <TemplatePlotGroups
        draggedRef={draggedRef}
        draggedOverGroup={draggedOverGroup}
        handleDropInSection={handleDropInSection}
        handleEnteringSection={handleEnteringSection}
        nbItemsPerRow={nbItemsPerRow}
        sections={sections}
        setSections={setSections}
        setSectionEntries={setSectionEntries}
      />
      <AddedSection
        {...newDropSection}
        id={NewSectionBlock.BOTTOM}
        closestSection={lastSection}
      />
      {shouldShowTooManyPlotsMessage && <TooManyPlots />}
    </div>
  )
}
