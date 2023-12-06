import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { DragAndDropPlot } from './DragAndDropPlot'
import { plotDataStore } from './plotDataStore'
import { VirtualizedGrid } from '../../shared/components/virtualizedGrid/VirtualizedGrid'

interface DragAndDropGridProps {
  order: string[]
  setOrder: (order: string[]) => void
  groupId: string
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
  nbItemsPerRow,
  useVirtualizedGrid,
  parentDraggedOver,
  multiView,
  sectionKey
}) => {
  const plotClassName = cx(styles.plot, styles.dragAndDropPlot, {
    [styles.multiViewPlot]: multiView
  })
  const items = order.map((plot: string) => {
    const colSpan =
      (multiView &&
        plotDataStore[PlotsSection.TEMPLATE_PLOTS][plot].revisions?.length) ||
      1

    return (
      <DragAndDropPlot
        key={plot}
        data-testid={`plot_${plot}`}
        plot={plot}
        sectionKey={sectionKey}
        className={plotClassName}
        colSpan={colSpan}
        group={groupId}
        isParentDraggedOver={parentDraggedOver}
        setOrder={setOrder}
        order={order}
      />
    )
  })

  return useVirtualizedGrid ? (
    <VirtualizedGrid nbItemsPerRow={nbItemsPerRow}>{items}</VirtualizedGrid>
  ) : (
    <>{items}</>
  )
}
