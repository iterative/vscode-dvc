import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import cx from 'classnames'
import { DropTarget } from './DropTarget'
import { plotDataStore } from './plotDataStore'
import styles from './styles.module.scss'
import { withScale } from '../../util/styles'
import { VirtualizedGrid } from '../../shared/components/virtualizedGrid/VirtualizedGrid'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import {
  DragDropContainer,
  OnDrop,
  WrapperProps
} from '../../shared/components/dragDrop/DragDropContainer'

interface DragAndDropGridProps {
  order: string[]
  setOrder: (order: string[]) => void
  groupId: string
  onDrop?: OnDrop
  nbItemsPerRow: number
  useVirtualizedGrid?: boolean
  parentDraggedOver?: boolean
  disabledDragPlotIds?: string[]
  multiView?: boolean
}

export const DragAndDropGrid: React.FC<DragAndDropGridProps> = ({
  order,
  setOrder,
  groupId,
  onDrop,
  nbItemsPerRow,
  useVirtualizedGrid,
  parentDraggedOver,
  disabledDragPlotIds,
  multiView
}) => {
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
        <GripIcon className={styles.plotGripIcon} />

        <h2>{plot}</h2>
      </div>
    )
  })

  return (
    <DragDropContainer
      order={order}
      setOrder={setOrder}
      items={items}
      group={groupId}
      onDrop={onDrop}
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
      disabledDropIds={disabledDragPlotIds}
    />
  )
}
