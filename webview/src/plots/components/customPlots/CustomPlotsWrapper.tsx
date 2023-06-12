import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { CustomPlots } from './CustomPlots'
import { changeSize } from './customPlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'
import { addCustomPlot, removeCustomPlots } from '../../util/messages'

export const CustomPlotsWrapper: React.FC = () => {
  const { plotsIds, nbItemsPerRow, isCollapsed, height, enablePlotCreation } =
    useSelector((state: PlotsState) => state.custom)
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  useEffect(() => {
    setSelectedPlots(plotsIds)
  }, [plotsIds, setSelectedPlots])

  const hasItems = plotsIds.length > 0

  return (
    <PlotsContainer
      title="Custom"
      sectionKey={PlotsSection.CUSTOM_PLOTS}
      nbItemsPerRowOrWidth={nbItemsPerRow}
      sectionCollapsed={isCollapsed}
      addPlotsButton={
        enablePlotCreation ? { onClick: addCustomPlot } : undefined
      }
      removePlotsButton={hasItems ? { onClick: removeCustomPlots } : undefined}
      changeSize={changeSize}
      hasItems={hasItems}
      height={height}
    >
      <CustomPlots plotsIds={selectedPlots} />
    </PlotsContainer>
  )
}
