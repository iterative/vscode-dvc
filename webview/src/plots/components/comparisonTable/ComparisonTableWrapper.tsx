import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ComparisonTable } from './ComparisonTable'
import { changeSize } from './comparisonTableSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsRootState } from '../../store'

export const ComparisonTableWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const { size, isCollapsed } = useSelector(
    (state: PlotsRootState) => state.comparison
  )
  const handleResize = (size: PlotSize) => {
    dispatch(changeSize(size))
  }

  return (
    <PlotsContainer
      title="Images"
      sectionKey={Section.COMPARISON_TABLE}
      currentSize={size}
      sectionCollapsed={isCollapsed}
      onResize={handleResize}
    >
      <ComparisonTable />
    </PlotsContainer>
  )
}
