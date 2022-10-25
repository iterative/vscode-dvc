import cx from 'classnames'
import { Section, TemplatePlotEntry } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { VisualizationSpec } from 'react-vega'
import { changeDisabledDragIds, changeSize } from './templatePlotsSlice'
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
import { PlotsState } from '../../store'
import { sendMessage } from '../../../shared/vscode'

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
  const dispatch = useDispatch()
  const [order, setOrder] = useState<string[]>([])
  const maxSize = useSelector((state: PlotsState) => state.webview.maxPlotSize)

  const disabledDragPlotIds = useSelector(
    (state: PlotsState) => state.template.disabledDragPlotIds
  )
  const currentSize = useSelector((state: PlotsState) => state.template.size)
  const lockedinSize = useRef(currentSize)

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

  const resizePlots = useCallback(
    (diff: number) => {
      const newSize = Math.abs(Math.min(lockedinSize.current + diff, maxSize))

      dispatch(changeSize(newSize))
      sendMessage({
        payload: { section: Section.TEMPLATE_PLOTS, size: newSize },
        type: MessageFromWebviewType.RESIZE_PLOTS
      })
    },
    [dispatch, maxSize]
  )

  const items = reorderedItems.map((plot: TemplatePlotEntry) => {
    const { id, content, multiView, revisions } = plot
    const nbRevisions = (multiView && revisions?.length) || 1

    const toggleDrag = (enabled: boolean) => {
      dispatch(changeDisabledDragIds(enabled ? [] : [id]))
      if (enabled) {
        lockedinSize.current = currentSize
      }
    }

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
          toggleDrag={toggleDrag}
          onResize={resizePlots}
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
      disabledDropIds={disabledDragPlotIds}
    />
  )
}
