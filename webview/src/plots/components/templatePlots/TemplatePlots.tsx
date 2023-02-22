import { TemplatePlotGroup } from 'dvc/src/plots/webview/contract'
import React, {
  DragEvent,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { AddedSection } from './AddedSection'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import { PlotGroup } from './templatePlotsSlice'
import { removeFromPreviousAndAddToNewSection } from './util'
import { sendMessage } from '../../../shared/vscode'
import { createIDWithIndex, getIDIndex } from '../../../util/ids'
import styles from '../styles.module.scss'
import { shouldUseVirtualizedGrid } from '../util'
import { PlotsState } from '../../store'
import { setDraggedOverGroup } from '../../../shared/components/dragDrop/dragDropSlice'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { isSameGroup } from '../../../shared/components/dragDrop/DragDropContainer'
import { changeOrderWithDraggedInfo } from '../../../util/array'
import { LoadingSection, sectionIsLoading } from '../LoadingSection'

export enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

export const TemplatePlots: React.FC = () => {
  const { plotSections, size } = useSelector(
    (state: PlotsState) => state.template
  )
  const draggedOverGroup = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedOverGroup
  )
  const draggedRef = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef
  )
  const selectedRevisions = useSelector(
    (state: PlotsState) => state.webview.selectedRevisions
  )

  const [sections, setSections] = useState<PlotGroup[]>(plotSections)
  const [hoveredSection, setHoveredSection] = useState('')
  const nbItemsPerRow = size
  const shouldSendMessage = useRef(true)
  const dispatch = useDispatch()

  useEffect(() => {
    shouldSendMessage.current = false
    setSections(plotSections)
  }, [plotSections, setSections])

  useEffect(() => {
    if (sections && shouldSendMessage.current) {
      sendMessage({
        payload: sections.map(section => ({
          group: section.group,
          paths: section.entries
        })),
        type: MessageFromWebviewType.REORDER_PLOTS_TEMPLATES
      })
    }
    shouldSendMessage.current = true
  }, [sections])

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
      setSections(sections => {
        const updatedSections = [...sections]
        updatedSections[index] = {
          ...sections[index],
          entries
        }
        return updatedSections
      })
    },
    [setSections]
  )

  if (sectionIsLoading(selectedRevisions)) {
    return <LoadingSection />
  }
  if (!sections || sections.length === 0) {
    return <EmptyState isFullScreen={false}>No Plots to Display</EmptyState>
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
    <>
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

          if (draggedRef.group === groupId) {
            const order = section.entries
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
              section.entries.length
            )
          }
        }

        const handleDragOver = (e: DragEvent) => {
          e.preventDefault()
          handleEnteringSection(groupId)
        }

        return (
          <div
            key={groupId}
            id={groupId}
            data-testid={`plots-section_${groupId}`}
            className={classes}
            onDragEnter={() => handleEnteringSection(groupId)}
            onDragOver={handleDragOver}
            onDrop={handleDropAtTheEnd}
          >
            <TemplatePlotsGrid
              groupId={groupId}
              groupIndex={i}
              onDropInSection={handleDropInSection}
              multiView={isMultiView}
              setSectionEntries={setSectionEntries}
              useVirtualizedGrid={useVirtualizedGrid}
              nbItemsPerRow={nbItemsPerRow}
              parentDraggedOver={draggedOverGroup === groupId}
              entries={section.entries}
            />
          </div>
        )
      })}
      <AddedSection
        {...newDropSection}
        id={NewSectionBlock.BOTTOM}
        closestSection={lastSection}
      />
    </>
  )
}
