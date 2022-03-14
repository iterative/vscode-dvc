import { TemplatePlot, VegaPlots } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { VegaLite, VisualizationSpec } from 'react-vega'
import cx from 'classnames'
import styles from './styles.module.scss'
import { config } from './constants'
import {
  Items,
  performOrderedUpdate,
  reorderObjectList
} from '../../util/objects'
import { DragDropContainer } from '../../shared/components/dragDrop/DragDropContainer'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { withScale } from '../../util/styles'

interface TemplatePlotGridProps {
  entries: VegaPlots
  group: string
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
      ...plots.map((plot, i) => ({ ...plot, id: `plot-${path}-${i}`, path }))
    ]
  }
  return acc
}

export const TemplatePlotGrid: React.FC<TemplatePlotGridProps> = ({
  entries,
  group
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

  const items = reorderedItems.map((plot: TemplatePlotEntry) => {
    const nbRevisions = (plot.multiView && plot.revisions?.length) || 1
    const className = cx(styles.plot, {
      [styles.multiViewPlot]: plot.multiView
    })
    return (
      <div
        key={plot.id}
        id={plot.id}
        data-testid={plot.id}
        className={className}
        style={withScale(nbRevisions)}
      >
        <GripIcon className={styles.plotGripIcon} />
        <VegaLite
          actions={false}
          config={config}
          spec={
            {
              ...plot.content,
              height: 'container',
              width: 'container'
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
      disabledDropIds={[]}
      items={items as JSX.Element[]}
      group={group}
    />
  )
}
