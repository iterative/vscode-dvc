import { Section } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { CustomPlots } from './CustomPlots'
import { changeSize } from './customPlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'
import { sendMessage } from '../../../shared/vscode'

export const CustomPlotsWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const { plotsIds, size, isCollapsed } = useSelector(
    (state: PlotsState) => state.custom
  )
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  useEffect(() => {
    setSelectedPlots(plotsIds)
  }, [plotsIds, setSelectedPlots])

  const handleResize = (size: number) => {
    dispatch(changeSize(size))
  }

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
      currentSize={size}
      sectionCollapsed={isCollapsed}
      onResize={handleResize}
      addPlotsButton={{ onClick: addCustomPlot }}
      removePlotsButton={{ onClick: removeCustomPlots }}
    >
      <CustomPlots plotsIds={selectedPlots} />
    </PlotsContainer>
  )
}
