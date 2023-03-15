import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { changeDisabledDragIds } from './templatePlotsSlice'
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
  parentDraggedOver
}) => {
  const dispatch = useDispatch()
  const entries = useSelector(
    (state: PlotsState) => state.template.sections[groupIndex].entries
  )

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

  const setEntriesOrder = (order: string[]) =>
    setSectionEntries(groupIndex, order)

  const plotClassName = cx(styles.plot, {
    [styles.multiViewPlot]: multiView
  })

  const items = useMemo(
    () =>
      entries.map((plot: string) => {
        const colSpan =
          (multiView &&
            plotDataStore[PlotsSection.TEMPLATE_PLOTS][plot].revisions
              ?.length) ||
          1

        return (
          <div
            key={plot}
            id={plot}
            className={plotClassName}
            data-testid={`plot_${plot}`}
            style={withScale(colSpan)}
          >
            <ZoomablePlot
              id={plot}
              onViewReady={addEventsOnViewReady}
              changeDisabledDragIds={changeDisabledDragIds}
              currentSnapPoint={nbItemsPerRow}
              shouldNotResize={multiView}
              section={PlotsSection.TEMPLATE_PLOTS}
            />
          </div>
        )
      }),
    [entries, plotClassName, addEventsOnViewReady, nbItemsPerRow, multiView]
  )

  return (
    <DragDropContainer
      order={entries}
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
