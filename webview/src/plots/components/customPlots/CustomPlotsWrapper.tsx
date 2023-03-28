import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { CustomPlots } from './CustomPlots'
import { changeSize } from './customPlotsSlice'
import { PlotsContainer } from '../PlotsContainer'
import { PlotsState } from '../../store'
import { sendMessage } from '../../../shared/vscode'
import { Icon } from '../../../shared/components/Icon'
import { Info } from '../../../shared/components/icons'
import styles from '../styles.module.scss'

export const CustomPlotsWrapper: React.FC = () => {
  const {
    plotsIds,
    nbItemsPerRow,
    isCollapsed,
    height,
    enablePlotCreation,
    hasMissingCheckpointData
  } = useSelector((state: PlotsState) => state.custom)
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
      {hasMissingCheckpointData && (
        <div className={styles.plotsSectionMessage}>
          <Icon width={16} height={16} icon={Info} />
          <p>
            Select a checkpoint experiment to display checkpoint trend plots.
          </p>
        </div>
      )}
      <CustomPlots plotsIds={selectedPlots} />
    </PlotsContainer>
  )
}
