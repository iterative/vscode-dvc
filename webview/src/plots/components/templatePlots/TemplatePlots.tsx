import {
  Section,
  TemplatePlotEntry,
  TemplatePlotGroup,
  TemplatePlotSection
} from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useEffect, useContext } from 'react'
import cx from 'classnames'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { AddedSection } from './AddedSection'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import { removeFromPreviousAndAddToNewSection } from './util'
import { sendMessage } from '../../../shared/vscode'
import { createIDWithIndex, getIDIndex } from '../../../util/ids'
import styles from '../styles.module.scss'
import { ZoomablePlotProps } from '../ZoomablePlot'
import { PlotsSizeContext } from '../PlotsSizeContext'
import { MaxItemsBeforeVirtualization } from '../util'
import { useNbItemsPerRow } from '../../hooks/useNbItemsPerRow'

interface TemplatePlotsProps extends ZoomablePlotProps {
  plots: TemplatePlotSection[]
}

export enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

export const TemplatePlots: React.FC<TemplatePlotsProps> = ({
  plots,
  renderZoomedInPlot
}) => {
  const [sections, setSections] = useState<TemplatePlotSection[]>([])
  const [hoveredSection, setHoveredSection] = useState('')
  const { sizes } = useContext(PlotsSizeContext)
  const { [Section.TEMPLATE_PLOTS]: size } = sizes
  const nbItemsPerRow = useNbItemsPerRow(size)

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
      type: MessageFromWebviewType.REORDER_PLOTS_TEMPLATES
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
        setTimeout(() => setSectionOrder([newSection, ...updatedSections]), 1)
      }
      return
    }
    if (lastSection.group !== group) {
      setTimeout(() => setSectionOrder([...updatedSections, newSection]), 1)
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

    setSectionOrder(updatedSections)
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

        const useBigGrid =
          Object.keys(section.entries).length >
          MaxItemsBeforeVirtualization[size]

        const isMultiView = section.group === TemplatePlotGroup.MULTI_VIEW

        const classes = cx({
          [styles.multiViewPlotsGrid]: isMultiView,
          [styles.singleViewPlotsGrid]: !isMultiView,
          [styles.noBigGrid]: !useBigGrid
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
                renderZoomedInPlot={renderZoomedInPlot}
                useBigGrid={useBigGrid}
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
