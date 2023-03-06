import { Section } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { TemplatePlots } from './TemplatePlots'
import { changeAspectRatio, changeSize } from './templatePlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'

export const TemplatePlotsWrapper: React.FC = () => {
  const { nbItemsPerRow, isCollapsed, aspectRatio } = useSelector(
    (state: PlotsState) => state.template
  )

  return (
    <PlotsContainer
      title="Data Series"
      sectionKey={Section.TEMPLATE_PLOTS}
      nbItemsPerRow={nbItemsPerRow}
      sectionCollapsed={isCollapsed}
      changeNbItemsPerRow={changeSize}
      changeAspectRatio={changeAspectRatio}
      aspectRatio={aspectRatio}
    >
      <TemplatePlots />
    </PlotsContainer>
  )
}
