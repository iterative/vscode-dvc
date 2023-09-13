import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { TemplatePlots } from './TemplatePlots'
import { changeSize } from './templatePlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'
import { addPipelinePlot } from '../../util/messages'

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
      addPlotsButton={{ onClick: addPipelinePlot }}
    >
      <TemplatePlots />
    </PlotsContainer>
  )
}
