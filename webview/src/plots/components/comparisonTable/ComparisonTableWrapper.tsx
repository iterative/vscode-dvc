import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { ComparisonTable } from './ComparisonTable'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'

export const ComparisonTableWrapper: React.FC = () => {
  const { nbItemsPerRow, isCollapsed, height } = useSelector(
    (state: PlotsState) => state.comparison
  )

  return (
    <PlotsContainer
      title="Images"
      sectionKey={PlotsSection.COMPARISON_TABLE}
      nbItemsPerRow={nbItemsPerRow}
      sectionCollapsed={isCollapsed}
      height={height}
    >
      <ComparisonTable />
    </PlotsContainer>
  )
}
