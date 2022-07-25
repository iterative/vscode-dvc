import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TemplatePlots } from './TemplatePlots'
import { changeSize } from './templatePlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'

export const TemplatePlotsWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const { size, isCollapsed } = useSelector(
    (state: PlotsState) => state.template
  )

  const handleResize = (size: PlotSize) => {
    dispatch(changeSize(size))
  }

  return (
    <PlotsContainer
      title="Data Series"
      sectionKey={Section.TEMPLATE_PLOTS}
      currentSize={size}
      sectionCollapsed={isCollapsed}
      onResize={handleResize}
    >
      <TemplatePlots />
    </PlotsContainer>
  )
}
