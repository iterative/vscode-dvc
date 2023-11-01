import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { CustomPlots } from './CustomPlots'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'
import { removeCustomPlots } from '../../util/messages'

export const CustomPlotsWrapper: React.FC = () => {
  const { plotsIds, nbItemsPerRow, isCollapsed, height, hasAddedPlots } =
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
      removePlotsButton={
        hasAddedPlots ? { onClick: removeCustomPlots } : undefined
      }
      hasItems={hasItems}
      height={height}
    >
      <CustomPlots plotsIds={selectedPlots} />
    </PlotsContainer>
  )
}
