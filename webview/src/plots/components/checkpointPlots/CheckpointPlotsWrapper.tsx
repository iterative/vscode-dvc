import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CheckpointPlots } from './CheckpointPlots'
import { changeSize } from './checkpointPlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { sendMessage } from '../../../shared/vscode'
import { RootState } from '../../store'

export const CheckpointPlotsWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const { plotsIds, size, selectedMetrics, isCollapsed, colors } = useSelector(
    (state: RootState) => state.checkpoint
  )
  const [metrics, setMetrics] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])

  useEffect(() => {
    setMetrics([...plotsIds].sort())
    setSelectedPlots(selectedMetrics || [])
  }, [plotsIds, selectedMetrics, setSelectedPlots, setMetrics])

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
      title="Trends"
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
      <CheckpointPlots plotsIds={selectedPlots} colors={colors} />
    </PlotsContainer>
  )
}
