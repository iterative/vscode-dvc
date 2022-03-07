import { VegaPlot, VegaPlots } from 'dvc/src/plots/webview/contract'
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

interface StaticPlotGridProps {
  entries: VegaPlots
  group: string
}

interface StaticPlotEntry extends VegaPlot {
  path: string
  id: string
}

export const StaticPlotGrid: React.FC<StaticPlotGridProps> = ({
  entries,
  group
}) => {
  const [allPlots, setAllPlots] = useState<StaticPlotEntry[]>([])
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    setAllPlots(
      Object.entries(entries).reduce(
        (acc: StaticPlotEntry[], [path, plots]) => {
          return acc.concat(
            plots.map((plot, i) => ({ ...plot, id: `plot-${path}-${i}`, path }))
          )
        },
        []
      )
    )
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
  ) as unknown as StaticPlotEntry[]

  const items = reorderedItems.map((plot: StaticPlotEntry) => {
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
