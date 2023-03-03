import { Section } from 'dvc/src/plots/webview/contract'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { CheckpointPlots } from './CheckpointPlots'
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

  const menu =
    plotsIds.length > 0
      ? {
          plots: metrics,
          selectedPlots,
          setSelectedPlots: setSelectedMetrics
        }
      : undefined

  return (
    <PlotsContainer
      title="Trends"
      sectionKey={Section.CHECKPOINT_PLOTS}
      menu={menu}
      nbItemsPerRow={nbItemsPerRow}
      height={height}
      sectionCollapsed={isCollapsed}
    >
      <CheckpointPlots plotsIds={selectedPlots} colors={colors} />
    </PlotsContainer>
  )
}
