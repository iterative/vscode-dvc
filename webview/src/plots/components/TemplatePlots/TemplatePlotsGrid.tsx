import {
  TemplatePlotEntry,
  TemplatePlotGroup,
  TemplatePlotSection
} from 'dvc/src/plots/webview/contract'
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
import { createIDWithIndex } from '../../../util/ids'

interface TemplatePlotsGridProps {
  entries: TemplatePlotEntry[]
  group: TemplatePlotGroup
  groupIndex: number
  onDropInSection: (
    draggedId: string,
    draggedGroup: string,
    groupId: string
  ) => void
  draggedRef?: MutableRefObject<DraggedInfo | undefined>
  sections: TemplatePlotSection[]
  setSections: (sections: TemplatePlotSection[]) => void
}

const autoSize = {
  height: 'container',
  width: 'container'
}

export const TemplatePlotsGrid: React.FC<TemplatePlotsGridProps> = ({
  entries,
  group,
  groupIndex,
  onDropInSection,
  draggedRef,
  sections,
  setSections
}) => {
  const groupId = createIDWithIndex(group, groupIndex)

  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    setOrder(entries.map(({ id }) => id))
  }, [entries])

  const setEntryOrder = (order: string[]) => {
    setOrder(order)

    sections[groupIndex] = {
      entries: reorderObjectList(order, entries, 'id') as TemplatePlotEntry[],
      group
    }

    setSections(sections)
  }

  const reorderedItems = reorderObjectList(
    order,
    entries,
    'id'
  ) as TemplatePlotEntry[]

  const plotClassName = cx(styles.plot, {
    [styles.multiViewPlot]: group === TemplatePlotGroup.MULTI_VIEW
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
