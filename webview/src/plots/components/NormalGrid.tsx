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
  changeDisabledDragIds: (disabled: string[]) => void
}

export const NormalGrid: React.FC<NormalGridProps> = ({
  useVirtualizedGrid,
  nbItemsPerRow,
  order,
  multiView,
  sectionKey,
  changeDisabledDragIds
}) => {
  const addDisabled = useCallback(
    (e: Event) => {
      const disabledId = (e.currentTarget as HTMLFormElement).closest('.plot')
        ?.id
      changeDisabledDragIds([disabledId].filter(Boolean) as string[])
    },
    [changeDisabledDragIds]
  )

  const removeDisabled = useCallback(() => {
    changeDisabledDragIds([])
  }, [changeDisabledDragIds])

  const disableClick = useCallback((e: Event) => {
    e.stopPropagation()
  }, [])

  const addEventsOnViewReady = useCallback(() => {
    const panels = document.querySelectorAll('.vega-bindings')
    for (const panel of Object.values(panels)) {
      panel.addEventListener('mouseenter', addDisabled)
      panel.addEventListener('mouseleave', removeDisabled)
      panel.addEventListener('click', disableClick)
    }
  }, [addDisabled, removeDisabled, disableClick])

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
    <VirtualizedGrid nbItemsPerRow={nbItemsPerRow} items={plots} />
  ) : (
    <>{plots}</>
  )
}
