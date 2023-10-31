import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  changeDisabledDragIds,
  toggleDragAndDropMode
} from './templatePlotsSlice'
import { OnDrop } from '../../../shared/components/dragDrop/DragDropContainer'
import { PlotsState } from '../../store'
import { Grid } from '../Grid'

interface TemplatePlotsGridProps {
  groupId: string
  groupIndex: number
  onDropInSection: OnDrop
  multiView: boolean
  setSectionEntries: (groupIndex: number, entries: string[]) => void
  useVirtualizedGrid?: boolean
  nbItemsPerRow: number
  parentDraggedOver?: boolean
}

export const TemplatePlotsGrid: React.FC<TemplatePlotsGridProps> = ({
  groupId,
  groupIndex,
  onDropInSection,
  multiView,
  setSectionEntries,
  useVirtualizedGrid,
  nbItemsPerRow,
  parentDraggedOver
}) => {
  const dispatch = useDispatch()
  const entries = useSelector(
    (state: PlotsState) => state.template.sections[groupIndex].entries
  )
  const isInDragAndDropMode = useSelector(
    (state: PlotsState) => state.template.isInDragAndDropMode
  )

  const disabledDragPlotIds = useSelector(
    (state: PlotsState) => state.template.disabledDragPlotIds
  )

  // TODO  Used for re-rendering => move this to zoomable plot to avoid higher component rerenders
  /*const revisionsLength = multiView
    ? entries
        .map(
          entry =>
            plotDataStore[PlotsSection.TEMPLATE_PLOTS][entry].revisions?.length
        )
        .join('')
    : ''*/

  const setEntriesOrder = (order: string[]) => {
    setSectionEntries(groupIndex, order)
  }

  return (
    <Grid
      setOrder={setEntriesOrder}
      nbItemsPerRow={nbItemsPerRow}
      useVirtualizedGrid={useVirtualizedGrid}
      order={entries}
      groupId={groupId}
      onDrop={onDropInSection}
      parentDraggedOver={parentDraggedOver}
      disabledDragPlotIds={disabledDragPlotIds}
      isInDragAndDropMode={isInDragAndDropMode}
      multiView={multiView}
      changeDisabledDragIds={(disabled: string[]) =>
        dispatch(changeDisabledDragIds(disabled))
      }
      sectionKey={PlotsSection.TEMPLATE_PLOTS}
    />
  )
}
