import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useDispatch } from 'react-redux'
import cx from 'classnames'
import { DropTarget } from './DropTarget'
import { plotDataStore } from './plotDataStore'
import styles from './styles.module.scss'
import { changeDragAndDropMode } from './util'
import { withScale } from '../../util/styles'
import { VirtualizedGrid } from '../../shared/components/virtualizedGrid/VirtualizedGrid'
import {
  DragDropContainer,
  OnDrop,
  WrapperProps
} from '../../shared/components/dragDrop/DragDropContainer'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'

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
  const items = order.map((plot: string) => {
    const colSpan =
      (multiView &&
        plotDataStore[PlotsSection.TEMPLATE_PLOTS][plot].revisions?.length) ||
      1

    const plotClassName = cx(styles.plot, styles.dragAndDropPlot, {
      [styles.multiViewPlot]: multiView
    })

    return (
      <div
        key={plot}
        id={plot}
        className={plotClassName}
        data-testid={`plot_${plot}`}
        style={withScale(colSpan)}
      >
        <div>
          <GripIcon className={styles.plotGripIcon} />
        </div>
        <h2>{plot}</h2>
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
