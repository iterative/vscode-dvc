import React, { useCallback } from 'react'
import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { ZoomablePlot } from './ZoomablePlot'
import { plotDataStore } from './plotDataStore'
import styles from './styles.module.scss'
import { VirtualizedGrid } from '../../shared/components/virtualizedGrid/VirtualizedGrid'
import { withScale } from '../../util/styles'

export interface NormalGridProps {
  useVirtualizedGrid?: boolean
  nbItemsPerRow: number
  order: string[]
  multiView?: boolean
  sectionKey: PlotsSection
}

export const NormalGrid: React.FC<NormalGridProps> = ({
  useVirtualizedGrid,
  nbItemsPerRow,
  order,
  multiView,
  sectionKey
}) => {
  const disableClick = useCallback((e: Event) => {
    e.stopPropagation()
  }, [])

  const addEventsOnViewReady = useCallback(() => {
    const panels = document.querySelectorAll('.vega-bindings')
    for (const panel of Object.values(panels)) {
      panel.addEventListener('click', disableClick)
      panel.addEventListener('mousedown', disableClick)
    }
  }, [disableClick])

  const plots = order.map((plot: string) => {
    const colSpan =
      (multiView &&
        plotDataStore[PlotsSection.TEMPLATE_PLOTS][plot].revisions?.length) ||
      1

    return (
      <div
        key={plot}
        id={plot}
        className={cx(styles.plot, {
          [styles.multiViewPlot]: multiView
        })}
        data-testid={`plot_${plot}`}
        style={withScale(colSpan)}
      >
        <ZoomablePlot
          id={plot}
          onViewReady={addEventsOnViewReady}
          currentSnapPoint={nbItemsPerRow}
          shouldNotResize={multiView}
          section={sectionKey}
        />
      </div>
    )
  })

  return useVirtualizedGrid ? (
    <VirtualizedGrid nbItemsPerRow={nbItemsPerRow}>{plots}</VirtualizedGrid>
  ) : (
    <>{plots}</>
  )
}
