import { Section } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { CustomPlots } from './CustomPlots'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'
import { sendMessage } from '../../../shared/vscode'

export const CustomPlotsWrapper: React.FC = () => {
  const { plotsIds, nbItemsPerRow, isCollapsed, height } = useSelector(
    (state: PlotsState) => state.custom
  )
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  useEffect(() => {
    setSelectedPlots(plotsIds)
  }, [plotsIds, setSelectedPlots])
  const addCustomPlot = () => {
    sendMessage({ type: MessageFromWebviewType.ADD_CUSTOM_PLOT })
  }

  const removeCustomPlots = () => {
    sendMessage({ type: MessageFromWebviewType.REMOVE_CUSTOM_PLOTS })
  }

  return (
    <PlotsContainer
      title="Custom"
      sectionKey={Section.CUSTOM_PLOTS}
      nbItemsPerRow={nbItemsPerRow}
      height={height}
      sectionCollapsed={isCollapsed}
      addPlotsButton={{ onClick: addCustomPlot }}
      removePlotsButton={
        plotsIds.length > 0 ? { onClick: removeCustomPlots } : undefined
      }
    >
      <CustomPlots plotsIds={selectedPlots} />
    </PlotsContainer>
  )
}
