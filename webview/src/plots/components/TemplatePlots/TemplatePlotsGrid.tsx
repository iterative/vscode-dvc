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
import { performOrderedUpdate, reorderObjectList } from '../../../util/objects'

interface TemplatePlotsGridProps {
  entries: TemplatePlotEntry[]
  group: string
  onDropInSection: (
    draggedId: string,
    draggedGroup: string,
    groupId: string
  ) => void
  draggedRef?: MutableRefObject<DraggedInfo | undefined>
  multiView?: boolean
}

const autoSize = {
  height: 'container',
  width: 'container'
}

export const TemplatePlotsGrid: React.FC<TemplatePlotsGridProps> = ({
  entries,
  group,
  onDropInSection,
  draggedRef,
  multiView
}) => {
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    setOrder(pastOrder => performOrderedUpdate(pastOrder, entries, 'id'))
  }, [entries])

  const reorderedItems = reorderObjectList(
    order,
    entries,
    'id'
  ) as TemplatePlotEntry[]

  const plotClassName = cx(styles.plot, {
    [styles.multiViewPlot]: multiView
  })

  const items = reorderedItems.map((plot: TemplatePlotEntry) => {
    const nbRevisions = (plot.multiView && plot.revisions?.length) || 1
    return (
      <div
        key={plot.id}
        id={plot.id}
        data-testid={plot.id}
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
      setOrder={setOrder}
      items={items as JSX.Element[]}
      group={group}
      onDrop={onDropInSection}
      draggedRef={draggedRef}
    />
  )
}
