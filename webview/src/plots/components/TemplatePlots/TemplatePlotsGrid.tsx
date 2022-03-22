import { TemplatePlot, VegaPlots } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState, MutableRefObject } from 'react'
import { VegaLite, VisualizationSpec } from 'react-vega'
import cx from 'classnames'
import styles from '../styles.module.scss'
import { config } from '../constants'
import {
  Items,
  performOrderedUpdate,
  reorderObjectList
} from '../../../util/objects'
import {
  DragDropContainer,
  DraggedInfo
} from '../../../shared/components/DragDrop/DragDropContainer'
import { GripIcon } from '../../../shared/components/DragDrop/GripIcon'
import { withScale } from '../../../util/styles'

interface TemplatePlotsGridProps {
  entries: VegaPlots
  group: string
  onDropInSection: (
    draggedId: string,
    draggedGroup: string,
    groupId: string
  ) => void
  draggedRef?: MutableRefObject<DraggedInfo | undefined>
  multiView?: boolean
}

interface TemplatePlotEntry extends TemplatePlot {
  path: string
  id: string
}

const addIdAndPath = (entries: VegaPlots) => {
  let acc: TemplatePlotEntry[] = []
  for (const [path, plots] of Object.entries(entries)) {
    acc = [
      ...acc,
      ...plots.map((plot, i) => ({ ...plot, id: `plot_${path}_${i}`, path }))
    ]
  }
  return acc
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
  const [allPlots, setAllPlots] = useState<TemplatePlotEntry[]>([])
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    const templatePlots = addIdAndPath(entries)
    setAllPlots(templatePlots)
  }, [entries])

  useEffect(() => {
    setOrder(pastOrder =>
      performOrderedUpdate(pastOrder, allPlots as unknown as Items, 'id')
    )
  }, [allPlots])

  const reorderedItems = reorderObjectList(
    order,
    allPlots as unknown as Items,
    'id'
  ) as unknown as TemplatePlotEntry[]
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
