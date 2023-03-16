import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { CheckpointPlots } from './CheckpointPlots'
import { changeSize } from './checkpointPlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { sendMessage } from '../../../shared/vscode'
import { PlotsState } from '../../store'

export const CheckpointPlotsWrapper: React.FC = () => {
  const {
    plotsIds,
    nbItemsPerRow,
    selectedMetrics,
    isCollapsed,
    colors,
    height
  } = useSelector((state: PlotsState) => state.checkpoint)
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

  const hasItems = plotsIds.length > 0

  const menu = hasItems
    ? {
        plots: metrics,
        selectedPlots,
        setSelectedPlots: setSelectedMetrics
      }
    : undefined

  return (
    <PlotsContainer
      title="Trends"
      sectionKey={PlotsSection.CHECKPOINT_PLOTS}
      menu={menu}
      nbItemsPerRow={nbItemsPerRow}
      sectionCollapsed={isCollapsed}
      changeSize={changeSize}
      hasItems={hasItems}
      height={height}
    >
      <CheckpointPlots plotsIds={selectedPlots} colors={colors} />
    </PlotsContainer>
  )
}
