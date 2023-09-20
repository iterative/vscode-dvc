import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { TemplatePlots } from './TemplatePlots'
import { changeSize } from './templatePlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'

export const TemplatePlotsWrapper: React.FC = () => {
  const { nbItemsPerRow, isCollapsed, height, hasItems } = useSelector(
    (state: PlotsState) => state.template
  )

  return (
    <PlotsContainer
      title="Data Series"
      sectionKey={PlotsSection.TEMPLATE_PLOTS}
      nbItemsPerRowOrWidth={nbItemsPerRow}
      sectionCollapsed={isCollapsed}
      changeSize={changeSize}
      hasItems={hasItems}
      height={height}
    >
      <TemplatePlots />
    </PlotsContainer>
  )
}
