import cx from 'classnames'
import { TemplatePlotEntry } from 'dvc/src/plots/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import React, { useEffect, useState, useCallback } from 'react'
import { VisualizationSpec } from 'react-vega'
import { VirtualizedGrid } from '../../../shared/components/virtualizedGrid/VirtualizedGrid'
import {
  DragDropContainer,
  OnDrop,
  WrapperProps
} from '../../../shared/components/dragDrop/DragDropContainer'
import { withScale } from '../../../util/styles'
import { DropTarget } from '../DropTarget'
import styles from '../styles.module.scss'
import { ZoomablePlot } from '../ZoomablePlot'

interface TemplatePlotsGridProps {
  entries: TemplatePlotEntry[]
  groupId: string
  groupIndex: number
  onDropInSection: OnDrop
  multiView: boolean
  setSectionEntries: (groupIndex: number, entries: TemplatePlotEntry[]) => void
  useVirtualizedGrid?: boolean
  nbItemsPerRow: number
  parentDraggedOver?: boolean
}

const autoSize = {
  height: 'container',
  width: 'container'
}

export const TemplatePlotsGrid: React.FC<TemplatePlotsGridProps> = ({
  entries,
  groupId,
  groupIndex,
  onDropInSection,
  multiView,
  setSectionEntries,
  useVirtualizedGrid,
  nbItemsPerRow,
  parentDraggedOver
}) => {
  const [order, setOrder] = useState<string[]>([])
  const [disabledDrag, setDisabledDrag] = useState('')

  const addDisabled = useCallback(
    (e: Event) => {
      setDisabledDrag(
        (e.currentTarget as HTMLFormElement).parentElement?.parentElement
          ?.parentElement?.id || ''
      )
    },
    [setDisabledDrag]
  )

  const removeDisabled = useCallback(() => {
    setDisabledDrag('')
  }, [setDisabledDrag])

  const disableClick = useCallback((e: Event) => {
    e.stopPropagation()
  }, [])

  useEffect(() => {
    setOrder(entries.map(({ id }) => id))
  }, [entries])

  useEffect(() => {
    const panels = document.querySelectorAll('.vega-bindings')
    return () => {
      for (const panel of Object.values(panels)) {
        panel.removeEventListener('mouseenter', addDisabled)
        panel.removeEventListener('mouseleave', removeDisabled)
        panel.removeEventListener('click', disableClick)
      }
    }
  }, [addDisabled, removeDisabled, disableClick])

  const addEventsOnViewReady = () => {
    const panels = document.querySelectorAll('.vega-bindings')
    for (const panel of Object.values(panels)) {
      panel.addEventListener('mouseenter', addDisabled)
      panel.addEventListener('mouseleave', removeDisabled)
      panel.addEventListener('click', disableClick)
    }
  }

  const setEntriesOrder = (order: string[]) => {
    setOrder(order)

    setSectionEntries(
      groupIndex,
      reorderObjectList<TemplatePlotEntry>(order, entries, 'id')
    )
  }

  const reorderedItems = reorderObjectList<TemplatePlotEntry>(
    order,
    entries,
    'id'
  )

  const plotClassName = cx(styles.plot, {
    [styles.multiViewPlot]: multiView
  })

  const items = reorderedItems.map((plot: TemplatePlotEntry, i) => {
    const { id, content, multiView, revisions } = plot
    const nbRevisions = (multiView && revisions?.length) || 1
    const isLastOfRow = nbItemsPerRow / (i + 1) === 1
    const isLastRow = i + 1 >= reorderedItems.length - nbItemsPerRow

    return (
      <div
        key={id}
        className={plotClassName}
        data-testid={`plot_${id}`}
        id={id}
        style={withScale(nbRevisions)}
      >
        <ZoomablePlot
          id={id}
          spec={{ ...content, ...autoSize } as VisualizationSpec}
          onViewReady={addEventsOnViewReady}
          showVerticalResizer={!isLastOfRow}
          showHorizontalResizer={!isLastRow}
        />
      </div>
    )
  })

  return (
    <DragDropContainer
      order={order}
      setOrder={setEntriesOrder}
      items={items as JSX.Element[]}
      group={groupId}
      onDrop={onDropInSection}
      dropTarget={<DropTarget />}
      wrapperComponent={
        useVirtualizedGrid
          ? {
              component: VirtualizedGrid as React.FC<WrapperProps>,
              props: { nbItemsPerRow }
            }
          : undefined
      }
      parentDraggedOver={parentDraggedOver}
      disabledDropIds={[disabledDrag]}
    />
  )
}
