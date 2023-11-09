import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useDispatch } from 'react-redux'
import cx from 'classnames'
import { DropTarget } from './DropTarget'
import { changeDragAndDropMode } from './util'
import styles from './styles.module.scss'
import { DragAndDropPlot } from './DragAndDropPlot'
import { plotDataStore } from './plotDataStore'
import { VirtualizedGrid } from '../../shared/components/virtualizedGrid/VirtualizedGrid'
import {
  DragDropContainer,
  OnDrop,
  WrapperProps
} from '../../shared/components/dragDrop/DragDropContainer'
import { withScale } from '../../util/styles'

interface DragAndDropGridProps {
  order: string[]
  setOrder: (order: string[]) => void
  groupId: string
  onDrop?: OnDrop
  nbItemsPerRow: number
  useVirtualizedGrid?: boolean
  parentDraggedOver?: boolean
  multiView?: boolean
  sectionKey: PlotsSection
}

export const DragAndDropGrid: React.FC<DragAndDropGridProps> = ({
  order,
  setOrder,
  groupId,
  onDrop,
  nbItemsPerRow,
  useVirtualizedGrid,
  parentDraggedOver,
  multiView,
  sectionKey
}) => {
  const dispatch = useDispatch()
  const plotClassName = cx(styles.plot, styles.dragAndDropPlot, {
    [styles.multiViewPlot]: multiView
  })
  const items = order.map((plot: string) => {
    const colSpan =
      (multiView &&
        plotDataStore[PlotsSection.TEMPLATE_PLOTS][plot].revisions?.length) ||
      1

    return (
      <div
        key={plot}
        id={plot}
        className={plotClassName}
        data-testid={`plot_${plot}`}
        style={withScale(colSpan)}
      >
        <DragAndDropPlot plot={plot} sectionKey={sectionKey} />
      </div>
    )
  })

  const handleOnDrop = (
    draggedId: string,
    draggedGroup: string,
    groupId: string,
    position: number
  ) => {
    changeDragAndDropMode(sectionKey, dispatch, true)
    onDrop?.(draggedId, draggedGroup, groupId, position)
  }

  const handleDragEnd = () => {
    changeDragAndDropMode(sectionKey, dispatch, true)
  }

  return (
    <DragDropContainer
      order={order}
      setOrder={setOrder}
      items={items}
      group={groupId}
      onDrop={handleOnDrop}
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
      onDragEnd={handleDragEnd}
    />
  )
}
