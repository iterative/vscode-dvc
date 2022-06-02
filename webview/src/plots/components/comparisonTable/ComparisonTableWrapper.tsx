import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ComparisonTable } from './ComparisonTable'
import { PlotsContainer } from '../PlotsContainer'
import { RootState } from '../../store'
import { changeSize } from './comparisonTableSlice'

export const ComparisonTableWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const { sectionName, size, isCollapsed } = useSelector(
    (state: RootState) => state.comparison
  )
  const handleResize = (size: PlotSize) => {
    dispatch(changeSize(size))
  }

  return (
    <PlotsContainer
      title={sectionName}
      sectionKey={Section.COMPARISON_TABLE}
      currentSize={size}
      sectionCollapsed={isCollapsed}
      onResize={handleResize}
    >
      <ComparisonTable />
    </PlotsContainer>
  )
}
