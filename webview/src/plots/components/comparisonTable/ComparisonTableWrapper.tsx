import { Section } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { ComparisonTable } from './ComparisonTable'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'

export const ComparisonTableWrapper: React.FC = () => {
  const { nbItemsPerRow, isCollapsed } = useSelector(
    (state: PlotsState) => state.comparison
  )

  return (
    <PlotsContainer
      title="Images"
      sectionKey={Section.COMPARISON_TABLE}
      currentSize={nbItemsPerRow}
      sectionCollapsed={isCollapsed}
    >
      <ComparisonTable />
    </PlotsContainer>
  )
}
