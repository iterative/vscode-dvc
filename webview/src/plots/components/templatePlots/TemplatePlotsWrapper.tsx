import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { TemplatePlots } from './TemplatePlots'
import { changeSize } from './templatePlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'
import { useNbOfItemsPerRow } from '../../hooks/useNumberOfItemsPerRowOrWidth'

export const TemplatePlotsWrapper: React.FC = () => {
  const { nbItemsPerRow, isCollapsed, height } = useSelector(
    (state: PlotsState) => state.template
  )
  const hasItems = useSelector(
    (state: PlotsState) => Object.keys(state.template.plotsSnapshots).length > 0
  )
  const nbItemsPerRowOrDefault = useNbOfItemsPerRow(nbItemsPerRow)

  return (
    <PlotsContainer
      title="Data Series"
      sectionKey={PlotsSection.TEMPLATE_PLOTS}
      nbItemsPerRowOrWidth={nbItemsPerRowOrDefault}
      sectionCollapsed={isCollapsed}
      changeSize={changeSize}
      hasItems={hasItems}
      height={height}
    >
      <TemplatePlots />
    </PlotsContainer>
  )
}
