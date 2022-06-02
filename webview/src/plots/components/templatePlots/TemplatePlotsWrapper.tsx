import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TemplatePlots } from './TemplatePlots'
import { PlotsContainer } from '../PlotsContainer'
import { RootState } from '../../store'
import { changeSize } from './templatePlotsSlice'

export const TemplatePlotsWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const { size, sectionName, isCollapsed } = useSelector(
    (state: RootState) => state.template
  )

  const handleResize = (size: PlotSize) => {
    dispatch(changeSize(size))
  }

  return (
    <PlotsContainer
      title={sectionName}
      sectionKey={Section.TEMPLATE_PLOTS}
      currentSize={size}
      sectionCollapsed={isCollapsed}
      onResize={handleResize}
    >
      <TemplatePlots />
    </PlotsContainer>
  )
}
