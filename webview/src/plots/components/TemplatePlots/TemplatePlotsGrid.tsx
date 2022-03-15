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
} from '../../../shared/components/dragDrop/DragDropContainer'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'
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
}

interface TemplatePlotEntry extends TemplatePlot {
  path: string
  id: string
}

export const TemplatePlotsGrid: React.FC<TemplatePlotsGridProps> = ({
  entries,
  group,
  onDropInSection,
  draggedRef
}) => {
  const [allPlots, setAllPlots] = useState<TemplatePlotEntry[]>([])
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    setAllPlots(
      Object.entries(entries).reduce(
        (acc: TemplatePlotEntry[], [path, plots]) => {
          return acc.concat(
            plots.map((plot, i) => ({ ...plot, id: `plot_${path}_${i}`, path }))
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
      onDrop={onDropInSection}
      draggedRef={draggedRef}
    />
  )
}
