import cx from 'classnames'
import { Section } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { changeDisabledDragIds, changeSize } from './templatePlotsSlice'
import { VirtualizedGrid } from '../../../shared/components/virtualizedGrid/VirtualizedGrid'
import {
  DragDropContainer,
  OnDrop,
  WrapperProps
} from '../../../shared/components/dragDrop/DragDropContainer'
import { DropTarget } from '../DropTarget'
import styles from '../styles.module.scss'
import { PlotsState } from '../../store'
import { withScale } from '../../../util/styles'
import { ZoomablePlot } from '../ZoomablePlot'
import { plotDataStore } from '../plotDataStore'

interface TemplatePlotsGridProps {
  groupId: string
  groupIndex: number
  onDropInSection: OnDrop
  multiView: boolean
  setSectionEntries: (groupIndex: number, entries: string[]) => void
  useVirtualizedGrid?: boolean
  nbItemsPerRow: number
  entries: string[]
  parentDraggedOver?: boolean
}

export const TemplatePlotsGrid: React.FC<TemplatePlotsGridProps> = ({
  groupId,
  groupIndex,
  onDropInSection,
  multiView,
  setSectionEntries,
  useVirtualizedGrid,
  nbItemsPerRow,
  entries,
  parentDraggedOver
}) => {
  const dispatch = useDispatch()
  const [order, setOrder] = useState<string[]>([])
  const currentSize = useSelector((state: PlotsState) => state.template.size)

  const disabledDragPlotIds = useSelector(
    (state: PlotsState) => state.template.disabledDragPlotIds
  )

  const addDisabled = useCallback(
    (e: Event) => {
      const disabledId = (e.currentTarget as HTMLFormElement).parentElement
        ?.parentElement?.parentElement?.id
      dispatch(changeDisabledDragIds(disabledId ? [disabledId] : []))
    },
    [dispatch]
  )

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  const disableClick = useCallback((e: Event) => {
    e.stopPropagation()
  }, [])

  useEffect(() => {
    setOrder(entries)
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

  const addEventsOnViewReady = useCallback(() => {
    const panels = document.querySelectorAll('.vega-bindings')
    for (const panel of Object.values(panels)) {
      panel.addEventListener('mouseenter', addDisabled)
      panel.addEventListener('mouseleave', removeDisabled)
      panel.addEventListener('click', disableClick)
    }
  }, [addDisabled, removeDisabled, disableClick])

  const setEntriesOrder = (order: string[]) => {
    setOrder(order)

    setSectionEntries(groupIndex, order)
  }

  const plotClassName = cx(styles.plot, {
    [styles.multiViewPlot]: multiView
  })

  const toggleDrag = useCallback(
    (enabled: boolean, id: string) => {
      dispatch(changeDisabledDragIds(enabled ? [] : [id]))
    },
    [dispatch]
  )

  const items = useMemo(
    () =>
      order.map((plot: string) => {
        const nbRevisions =
          (multiView &&
            plotDataStore[Section.TEMPLATE_PLOTS][plot].revisions?.length) ||
          1

        return (
          <div
            key={plot}
            id={plot}
            className={plotClassName}
            data-testid={`plot_${plot}`}
            style={withScale(nbRevisions)}
          >
            <ZoomablePlot
              id={plot}
              onViewReady={addEventsOnViewReady}
              toggleDrag={toggleDrag}
              changeSize={changeSize}
              currentSnapPoint={currentSize}
              shouldNotResize={multiView}
              section={Section.TEMPLATE_PLOTS}
            />
          </div>
        )
      }),
    [
      order,
      plotClassName,
      addEventsOnViewReady,
      currentSize,
      multiView,
      toggleDrag
    ]
  )

  return (
    <DragDropContainer
      order={order}
      setOrder={setEntriesOrder}
      items={items}
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
      disabledDropIds={disabledDragPlotIds}
    />
  )
}
