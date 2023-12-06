import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { PlotsState } from '../../store'
import { Grid } from '../Grid'

interface TemplatePlotsGridProps {
  groupId: string
  groupIndex: number
  multiView: boolean
  setSectionEntries: (groupIndex: number, entries: string[]) => void
  useVirtualizedGrid?: boolean
  nbItemsPerRow: number
  parentDraggedOver?: boolean
}

export const TemplatePlotsGrid: React.FC<TemplatePlotsGridProps> = ({
  groupId,
  groupIndex,
  multiView,
  setSectionEntries,
  useVirtualizedGrid,
  nbItemsPerRow,
  parentDraggedOver
}) => {
  const entries = useSelector(
    (state: PlotsState) => state.template.sections[groupIndex].entries
  )

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
      parentDraggedOver={parentDraggedOver}
      multiView={multiView}
      sectionKey={PlotsSection.TEMPLATE_PLOTS}
    />
  )
}
