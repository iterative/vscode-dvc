import { TemplatePlotEntry } from 'dvc/src/plots/webview/contract'
import { reorderObjectList } from 'dvc/src/util/array'
import React, { useEffect, useState, MutableRefObject } from 'react'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { Renderers } from 'vega'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import cx from 'classnames'
import styles from '../styles.module.scss'
import { config } from '../constants'
import {
  DragDropContainer,
  DraggedInfo,
  OnDrop
} from '../../../shared/components/dragDrop/DragDropContainer'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'
import { withScale } from '../../../util/styles'
import { DropTarget } from '../DropTarget'

interface TemplatePlotsGridProps {
  entries: TemplatePlotEntry[]
  groupId: string
  groupIndex: number
  onDropInSection: OnDrop
  draggedRef: MutableRefObject<DraggedInfo | undefined>
  multiView: boolean
  setSectionEntries: (groupIndex: number, entries: TemplatePlotEntry[]) => void
  onPlotClick: (plot: VegaLiteProps) => void
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
  draggedRef,
  multiView,
  setSectionEntries,
  onPlotClick
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
    const nbRevisions = (plot.multiView && plot.revisions?.length) || 1
    const plotProps = {
      actions: false,
      config,
      renderer: 'svg' as Renderers,
      spec: plot.content
    }

    return (
      <button
        key={plot.id}
        id={plot.id}
        data-testid={`plot_${plot.id}`}
        className={plotClassName}
        style={withScale(nbRevisions)}
        onClick={() => onPlotClick(plotProps)}
      >
        <GripIcon className={styles.plotGripIcon} />
        <VegaLite
          {...plotProps}
          spec={{ ...plotProps.spec, ...autoSize } as VisualizationSpec}
        />
      </button>
    )
  })

  return (
    <DragDropContainer
      order={order}
      setOrder={setEntriesOrder}
      items={items as JSX.Element[]}
      group={groupId}
      onDrop={onDropInSection}
      draggedRef={draggedRef}
      dropTarget={{
        element: <DropTarget />,
        wrapperTag: 'div'
      }}
    />
  )
}
