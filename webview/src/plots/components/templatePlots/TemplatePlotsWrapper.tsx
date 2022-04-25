import { Section, TemplatePlotsData } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { TemplatePlots } from './TemplatePlots'
import { ZoomablePlotProps } from './util'
import { BasicContainerProps, PlotsContainer } from '../PlotsContainer'

interface TemplatePlotsWrapperProps extends ZoomablePlotProps {
  templatePlots: TemplatePlotsData
  basicContainerProps: BasicContainerProps
}

export const TemplatePlotsWrapper: React.FC<TemplatePlotsWrapperProps> = ({
  templatePlots,
  basicContainerProps,
  onPlotClick
}) => {
  return (
    <PlotsContainer
      title={templatePlots.sectionName}
      sectionKey={Section.TEMPLATE_PLOTS}
      currentSize={templatePlots.size}
      {...basicContainerProps}
    >
      <TemplatePlots plots={templatePlots.plots} onPlotClick={onPlotClick} />
    </PlotsContainer>
  )
}
