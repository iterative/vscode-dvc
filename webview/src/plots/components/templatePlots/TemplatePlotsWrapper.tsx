import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { useSelector } from 'react-redux'
import { Errors } from './Errors'
import { TemplatePlots } from './TemplatePlots'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'

export const TemplatePlotsWrapper: React.FC = () => {
  const { nbItemsPerRow, isCollapsed, height, hasItems, errors } = useSelector(
    (state: PlotsState) => state.template
  )

  return (
    <PlotsContainer
      title="Data Series"
      sectionKey={PlotsSection.TEMPLATE_PLOTS}
      nbItemsPerRowOrWidth={nbItemsPerRow}
      sectionCollapsed={isCollapsed}
      hasItems={hasItems}
      height={height}
    >
      <Errors errors={errors} />
      <TemplatePlots />
    </PlotsContainer>
  )
}
