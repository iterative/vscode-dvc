import { TemplatePlotEntry } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState, MutableRefObject } from 'react'
import { VegaLite, VisualizationSpec } from 'react-vega'
import cx from 'classnames'
import styles from '../styles.module.scss'
import { config } from '../constants'
import {
  DragDropContainer,
  DraggedInfo
} from '../../../shared/components/dragDrop/DragDropContainer'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'
import { withScale } from '../../../util/styles'
import { reorderObjectList } from '../../../util/objects'

interface TemplatePlotsGridProps {
  entries: TemplatePlotEntry[]
  groupId: string
  groupIndex: number
  isMultiView: boolean
  onDropInSection: (
    draggedId: string,
    draggedGroup: string,
    groupId: string
  ) => void
  draggedRef?: MutableRefObject<DraggedInfo | undefined>
  setSectionEntries: (groupIndex: number, entries: TemplatePlotEntry[]) => void
}

const autoSize = {
  height: 'container',
  width: 'container'
}

export const TemplatePlotsGrid: React.FC<TemplatePlotsGridProps> = ({
  entries,
  groupId,
  groupIndex,
  isMultiView,
  onDropInSection,
  draggedRef,
  setSectionEntries
}) => {
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    setOrder(entries.map(({ id }) => id))
  }, [entries])

  const setEntryOrder = (order: string[]) => {
    setOrder(order)

    setSectionEntries(
      groupIndex,
      reorderObjectList(order, entries, 'id') as TemplatePlotEntry[]
    )
  }

  const reorderedItems = reorderObjectList(
    order,
    entries,
    'id'
  ) as TemplatePlotEntry[]

  const plotClassName = cx(styles.plot, {
    [styles.multiViewPlot]: isMultiView
  })

  const items = reorderedItems.map((plot: TemplatePlotEntry) => {
    const nbRevisions = (plot.multiView && plot.revisions?.length) || 1
    return (
      <div
        key={plot.id}
        id={plot.id}
        data-testid={`plot_${plot.id}`}
        className={plotClassName}
        style={withScale(nbRevisions)}
      >
        <GripIcon className={styles.plotGripIcon} />
        <VegaLite
          actions={false}
          config={config}
          spec={
            {
              ...plot.content,
              ...autoSize
            } as VisualizationSpec
          }
          renderer="svg"
        />
      </div>
    )
  })

  return (
    <DragDropContainer
      order={order}
      setOrder={setEntryOrder}
      items={items as JSX.Element[]}
      group={groupId}
      onDrop={onDropInSection}
      draggedRef={draggedRef}
    />
  )
}
