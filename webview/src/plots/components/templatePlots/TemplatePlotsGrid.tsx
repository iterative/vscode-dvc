import cx from 'classnames'
import { TemplatePlotEntry } from 'dvc/src/plots/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import React, { useEffect, useState } from 'react'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { VirtualizedGrid } from '../../../shared/components/virtualizedGrid/VirtualizedGrid'
import {
  DragDropContainer,
  OnDrop,
  WrapperProps
} from '../../../shared/components/dragDrop/DragDropContainer'
import { withScale } from '../../../util/styles'
import { config } from '../constants'
import { DropTarget } from '../DropTarget'
import styles from '../styles.module.scss'
import { ZoomablePlot } from '../ZoomablePlot'

interface TemplatePlotsGridProps {
  entries: TemplatePlotEntry[]
  groupId: string
  groupIndex: number
  onDropInSection: OnDrop
  multiView: boolean
  setSectionEntries: (groupIndex: number, entries: TemplatePlotEntry[]) => void
  useVirtualizedGrid?: boolean
  nbItemsPerRow: number
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
  nbItemsPerRow
}) => {
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    setOrder(entries.map(({ id }) => id))
  }, [entries])

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

  const items = reorderedItems.map((plot: TemplatePlotEntry) => {
    const { id, content, multiView, revisions } = plot
    const nbRevisions = (multiView && revisions?.length) || 1
    const plotProps = {
      actions: false,
      config,
      renderer: 'svg',
      spec: { ...content, ...autoSize }
    } as VegaLiteProps

    return (
      <div
        key={id}
        className={plotClassName}
        data-testid={`plot_${id}`}
        id={id}
        style={withScale(nbRevisions)}
      >
        <ZoomablePlot id={id} plotProps={JSON.stringify(plotProps)} />
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
      dropTarget={{
        element: <DropTarget />,
        wrapperTag: 'div'
      }}
      wrapperComponent={
        useVirtualizedGrid
          ? {
              component: VirtualizedGrid as React.FC<WrapperProps>,
              props: { nbItemsPerRow }
            }
          : undefined
      }
    />
  )
}
