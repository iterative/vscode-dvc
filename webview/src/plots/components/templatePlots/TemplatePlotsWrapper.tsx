import { Section, TemplatePlotsData } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { TemplatePlots } from './TemplatePlots'
import { BasicContainerProps, PlotsContainer } from '../PlotsContainer'
import { ZoomablePlotProps } from '../ZoomablePlot'

interface TemplatePlotsWrapperProps extends ZoomablePlotProps {
  templatePlots: TemplatePlotsData
  basicContainerProps: BasicContainerProps
}

export const TemplatePlotsWrapper: React.FC<TemplatePlotsWrapperProps> = ({
  templatePlots,
  basicContainerProps,
  renderZoomedInPlot
}) => (
  <PlotsContainer
    title="Data Series"
    sectionKey={Section.TEMPLATE_PLOTS}
    currentSize={templatePlots.size}
    {...basicContainerProps}
  >
    <TemplatePlots
      plots={templatePlots.plots}
      renderZoomedInPlot={renderZoomedInPlot}
    />
  </PlotsContainer>
)
