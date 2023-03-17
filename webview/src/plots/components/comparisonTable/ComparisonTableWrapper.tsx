import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { ComparisonTable } from './ComparisonTable'
import { changeSize } from './comparisonTableSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'

export const ComparisonTableWrapper: React.FC = () => {
  const { width, isCollapsed, height, plots } = useSelector(
    (state: PlotsState) => state.comparison
  )

  return (
    <PlotsContainer
      title="Images"
      sectionKey={PlotsSection.COMPARISON_TABLE}
      nbItemsPerRowOrWidth={width}
      changeSize={changeSize}
      sectionCollapsed={isCollapsed}
      height={height}
      hasItems={plots.length > 0}
      noHeight
    >
      <ComparisonTable />
    </PlotsContainer>
  )
}
