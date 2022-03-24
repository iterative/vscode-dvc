import { TemplatePlot, VegaPlots } from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useEffect, useRef } from 'react'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import {
  PlotSection,
  PlotsGroup,
  removeFromPreviousAndAddToNewSection
} from './utils'
import { AddedSection } from './AddedSection'
import { DraggedInfo } from '../../../shared/components/dragDrop1/DragDropContainer'
import {
  createIDWithIndex,
  getIDIndex,
  getIDWithoutIndexOrPrefix
} from '../../../util/ids'
import styles from '../styles.module.scss'

interface TemplatePlotsProps {
  plots: VegaPlots
}

type TemplatePlotAccumulator = {
  singleViewPlots: VegaPlots
  multiViewPlots: VegaPlots
}

export enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

const fillInPlotsType = (
  plotsType: VegaPlots,
  path: string,
  plot: TemplatePlot
) => {
  plotsType[path] = plotsType[path] ? [...plotsType[path], plot] : [plot]
}

const collectPlot = (
  acc: TemplatePlotAccumulator,
  path: string,
  plot: TemplatePlot
) => {
  if (plot.multiView) {
    fillInPlotsType(acc.multiViewPlots, path, plot)
    return
  }
  fillInPlotsType(acc.singleViewPlots, path, plot)
}

const splitPlotsByViewType = (plots: VegaPlots): TemplatePlotAccumulator => {
  const acc: TemplatePlotAccumulator = {
    multiViewPlots: {},
    singleViewPlots: {}
  }

  for (const [path, pathPlots] of Object.entries(plots)) {
    for (const plot of pathPlots) {
      collectPlot(acc, path, plot)
    }
  }
  return acc
}

export const TemplatePlots: React.FC<TemplatePlotsProps> = ({ plots }) => {
  const [sections, setSections] = useState<PlotSection[]>([])
  const [hoveredSection, setHoveredSection] = useState('')
  const draggedRef = useRef<DraggedInfo>()

  useEffect(() => {
    const { singleViewPlots, multiViewPlots } = splitPlotsByViewType(plots)
    setSections([
      {
        entries: singleViewPlots,
        group: PlotsGroup.SINGLE_VIEW
      },
      {
        entries: multiViewPlots,
        group: PlotsGroup.MULTI_VIEW
      }
    ])
  }, [plots, setSections])

  const firstSection = sections[0]
  const lastSection = sections.slice(-1)[0]

  if (!firstSection || !lastSection) {
    return null
  }

  const handleDropInNewSection = (e: DragEvent<HTMLElement>) => {
    const draggedSectionId = getIDIndex(e.dataTransfer.getData('group'))
    const draggedId = getIDWithoutIndexOrPrefix(
      e.dataTransfer.getData('itemId')
    )

    const updatedSections = removeFromPreviousAndAddToNewSection(
      sections,
      draggedSectionId,
      draggedId
    )

    const { group, entries } = sections[draggedSectionId]

    setHoveredSection('')
    const newSection = {
      entries: {
        [draggedId]: entries[draggedId]
      },
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
    const entryId = getIDWithoutIndexOrPrefix(draggedId)
    const entry = sections[oldGroupId].entries[entryId]
    const updatedSections = removeFromPreviousAndAddToNewSection(
      sections,
      oldGroupId,
      entryId,
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
