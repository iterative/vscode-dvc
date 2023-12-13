import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { DragAndDropPlot } from './DragAndDropPlot'
import { plotDataStore } from './plotDataStore'
import { VirtualizedGrid } from '../../shared/components/virtualizedGrid/VirtualizedGrid'
import { OnDrop } from '../../shared/hooks/useDragAndDrop'

interface DragAndDropGridProps {
  order: string[]
  setOrder: (order: string[]) => void
  groupId: string
  nbItemsPerRow: number
  useVirtualizedGrid?: boolean
  parentDraggedOver?: boolean
  multiView?: boolean
  sectionKey: PlotsSection
  onDrop?: OnDrop
}

export const DragAndDropGrid: React.FC<DragAndDropGridProps> = ({
  order,
  setOrder,
  groupId,
  nbItemsPerRow,
  useVirtualizedGrid,
  parentDraggedOver,
  multiView,
  sectionKey,
  onDrop
}) => {
  const plotClassName = cx(styles.plot, styles.dragAndDropPlot, {
    [styles.multiViewPlot]: multiView
  })
  const items = order.map((plot: string, i: number) => {
    const colSpan =
      (multiView &&
        plotDataStore[PlotsSection.TEMPLATE_PLOTS][plot]?.revisions?.length) ||
      1

    return (
      <DragAndDropPlot
        key={plot}
        id={plot}
        data-testid={`plot_${plot}`}
        plot={plot}
        sectionKey={sectionKey}
        className={plotClassName}
        colSpan={colSpan}
        group={groupId}
        isParentDraggedOver={parentDraggedOver}
        setOrder={setOrder}
        order={order}
        isLast={i === order.length - 1}
        afterOnDrop={onDrop}
      />
    )
  })

  return useVirtualizedGrid ? (
    <VirtualizedGrid nbItemsPerRow={nbItemsPerRow}>{items}</VirtualizedGrid>
  ) : (
    <>{items}</>
  )
}
