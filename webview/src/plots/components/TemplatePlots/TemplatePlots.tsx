import { TemplatePlot, VegaPlots } from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useEffect, useRef } from 'react'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import {
  PlotSection,
  PlotsGroup,
  removeFromPreviousSectionAndAddToNewSection
} from './utils'
import { AddedSection } from './AddedSection'
import { DraggedInfo } from '../../../shared/components/dragDrop/DragDropContainer'
import {
  createIdentifierWithIndex,
  getIdentifierIndex,
  getIdentifierWithoutIndexOrPrefix
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
    const dropInSection = e.currentTarget.id
    const draggedSection = e.dataTransfer.getData('group')
    const draggedSectionId = getIdentifierIndex(draggedSection)
    const draggedId = getIdentifierWithoutIndexOrPrefix(
      e.dataTransfer.getData('itemId')
    )

    const section = sections[draggedSectionId]
    const entry = section.entries[draggedId]
    const updatedSections = removeFromPreviousSectionAndAddToNewSection(
      sections,
      draggedSectionId,
      draggedId
    )

    setHoveredSection('')

    if (dropInSection === NewSectionBlock.TOP) {
      if (firstSection.group !== section.group) {
        setSections([
          {
            entries: {
              [draggedId]: entry
            },
            group: section.group
          },
          ...updatedSections
        ])
      }

      return
    }
    if (lastSection.group !== section.group) {
      setSections([
        ...updatedSections,
        {
          entries: {
            [draggedId]: entry
          },
          group: section.group
        }
      ])
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
    const oldGroupId = getIdentifierIndex(draggedGroup)
    const newGroupId = getIdentifierIndex(groupId)
    const entryId = getIdentifierWithoutIndexOrPrefix(draggedId)
    const entry = sections[oldGroupId].entries[entryId]
    const updatedSections = removeFromPreviousSectionAndAddToNewSection(
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
        const groupId = createIdentifierWithIndex(section.group, i)
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
