import {
  CheckpointPlotData,
  CheckpointPlotsData,
  Section
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useState } from 'react'
import { CheckpointPlots } from './CheckpointPlots'
import { BasicContainerProps, PlotsContainer } from '../PlotsContainer'
import { ZoomablePlotProps } from '../templatePlots/util'
import { sendMessage } from '../../../shared/vscode'

interface CheckpointPlotsWrapperProps extends ZoomablePlotProps {
  checkpointPlots: CheckpointPlotsData
  basicContainerProps: BasicContainerProps
}

const getMetricsFromPlots = (plots?: CheckpointPlotData[]): string[] =>
  plots?.map(({ title }) => title).sort() || []

export const CheckpointPlotsWrapper: React.FC<CheckpointPlotsWrapperProps> = ({
  checkpointPlots,
  basicContainerProps,
  onPlotClick
}) => {
  const [metrics, setMetrics] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])

  useEffect(() => {
    const metrics = getMetricsFromPlots(checkpointPlots.plots)
    setMetrics(metrics)
    setSelectedPlots(checkpointPlots.selectedMetrics || [])
  }, [checkpointPlots, setSelectedPlots, setMetrics])

  const setSelectedMetrics = (metrics: string[]) => {
    setSelectedPlots(metrics)
    sendMessage({
      payload: metrics,
      type: MessageFromWebviewType.METRIC_TOGGLED
    })
  }

  return (
    <PlotsContainer
      title={checkpointPlots.sectionName}
      sectionKey={Section.CHECKPOINT_PLOTS}
      menu={{
        plots: metrics,
        selectedPlots: selectedPlots,
        setSelectedPlots: setSelectedMetrics
      }}
      currentSize={checkpointPlots.size}
      {...basicContainerProps}
    >
      <CheckpointPlots
        plots={checkpointPlots.plots.filter(plot =>
          selectedPlots?.includes(plot.title)
        )}
        colors={checkpointPlots.colors}
        onPlotClick={onPlotClick}
      />
    </PlotsContainer>
  )
}
