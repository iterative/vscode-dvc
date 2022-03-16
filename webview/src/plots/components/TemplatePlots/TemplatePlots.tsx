import { TemplatePlot, VegaPlots } from 'dvc/src/plots/webview/contract'
import React, { DragEvent, useState, useEffect, useRef } from 'react'
import cx from 'classnames'
import { TemplatePlotsGrid } from './TemplatePlotsGrid'
import {
  PlotSection,
  PlotsGroup,
  removeFromPreviousSectionAndAddToNewSection
} from './actions'
import { DraggedInfo } from '../../../shared/components/dragDrop/DragDropContainer'
import {
  createIdentifierWithIndex,
  getIdentifierIndex,
  getIdentifierWithoutIndex,
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

enum NewSectionBlock {
  TOP = 'drop-section-top',
  BOTTOM = 'drop-section-bottom'
}

export const TemplatePlots: React.FC<TemplatePlotsProps> = ({ plots }) => {
  const [sections, setSections] = useState<PlotSection[]>([])
  const [hoveredSection, setHoveredSection] = useState('')
  const draggedRef = useRef<DraggedInfo>()

  useEffect(() => {
    const fillInPlotsType = (
      plotsType: VegaPlots,
      path: string,
      plot: TemplatePlot
    ) => {
      plotsType[path] = plotsType[path] ? [...plotsType[path], plot] : [plot]
    }

    const { singleViewPlots, multiViewPlots } = Object.entries(plots).reduce(
      (acc: TemplatePlotAccumulator, [path, plots]) => {
        plots.forEach(plot => {
          if (plot.multiView) {
            fillInPlotsType(acc.multiViewPlots, path, plot)
            return
          }
          fillInPlotsType(acc.singleViewPlots, path, plot)
        })
        return acc
      },
      { multiViewPlots: {}, singleViewPlots: {} }
    )
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
  const lastSection = sections.at(-1)

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

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    const draggedGroup = getIdentifierWithoutIndex(draggedRef.current?.group)
    const closestSection =
      e.currentTarget.id === NewSectionBlock.TOP ? firstSection : lastSection
    if (draggedGroup !== closestSection.group) {
      setHoveredSection(e.currentTarget.id)
    }
  }

  const handleDragLeave = () => {
    setHoveredSection('')
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
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: (e: DragEvent<HTMLElement>) => e.preventDefault(),
    onDrop: handleDropInNewSection
  }

  return (
    <div>
      <div
        id={NewSectionBlock.TOP}
        {...newDropSection}
        className={cx(styles.dropSection, {
          [styles.dropSectionMaximized]: hoveredSection === NewSectionBlock.TOP
        })}
      />
      {sections.map((section, i) => {
        const groupId = createIdentifierWithIndex(section.group, i)
        return (
          <div
            key={groupId}
            id={groupId}
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
      <div
        id={NewSectionBlock.BOTTOM}
        {...newDropSection}
        className={cx(styles.dropSection, {
          [styles.dropSectionMaximized]:
            hoveredSection === NewSectionBlock.BOTTOM
        })}
      />
    </div>
  )
}
