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

interface StaticPlotGirdProps {
  entries: VegaPlots
}

interface StaticPlotEntry extends VegaPlot {
  path: string
  id: string
}

export const StaticPlotGrid: React.FC<StaticPlotGirdProps> = ({ entries }) => {
  const allPlots = Object.entries(entries).reduce(
    (acc: StaticPlotEntry[], [path, plots]) => {
      return acc.concat(
        plots.map((plot, i) => ({ ...plot, id: `plot-${path}-${i}`, path }))
      )
    },
    []
  )

  const [order, setOrder] = useState(allPlots.map(plot => plot.id) as string[])

  useEffect(() => {
    setOrder(pastOrder =>
      performOrderedUpdate(pastOrder, allPlots as unknown as Items, 'id')
    )
  }, [allPlots])

  const items = (
    reorderObjectList(
      order,
      allPlots as unknown as Items,
      'id'
    ) as unknown as StaticPlotEntry[]
  ).map((plot: StaticPlotEntry) => {
    const nbRevisions = (plot.multiView && plot.revisions?.length) || 1
    const className = cx(styles.plot, {
      [styles.multiViewPlot]: plot.multiView
    })
    return (
      <div
        key={plot.id}
        id={plot.id}
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
    />
  )
}
