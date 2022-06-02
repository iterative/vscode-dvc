import {
  CheckpointPlotData,
  PlotSize,
  Section
} from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CheckpointPlots } from './CheckpointPlots'
import { PlotsContainer } from '../PlotsContainer'
import { sendMessage } from '../../../shared/vscode'
import { RootState } from '../../store'
import { changeSize } from './checkpointPlotsSlice'

const getMetricsFromPlots = (plots?: CheckpointPlotData[]): string[] =>
  plots?.map(({ title }) => title).sort() || []

export const CheckpointPlotsWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const { plots, size, sectionName, selectedMetrics, isCollapsed, colors } =
    useSelector((state: RootState) => state.checkpoint)
  const [metrics, setMetrics] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])

  useEffect(() => {
    const metrics = getMetricsFromPlots(plots)
    setMetrics(metrics)
    setSelectedPlots(selectedMetrics || [])
  }, [plots, selectedMetrics, setSelectedPlots, setMetrics])

  const setSelectedMetrics = (metrics: string[]) => {
    setSelectedPlots(metrics)
    sendMessage({
      payload: metrics,
      type: MessageFromWebviewType.TOGGLE_METRIC
    })
  }

  const handleResize = (size: PlotSize) => {
    dispatch(changeSize(size))
  }

  return (
    <PlotsContainer
      title={sectionName}
      sectionKey={Section.CHECKPOINT_PLOTS}
      menu={{
        plots: metrics,
        selectedPlots: selectedPlots,
        setSelectedPlots: setSelectedMetrics
      }}
      currentSize={size}
      sectionCollapsed={isCollapsed}
      onResize={handleResize}
    >
      <CheckpointPlots
        plots={plots.filter(plot => selectedPlots?.includes(plot.title))}
        colors={colors}
      />
    </PlotsContainer>
  )
}
