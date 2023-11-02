import React from 'react'
import { useSelector } from 'react-redux'
import { StartButton } from '../../../shared/components/button/StartButton'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { addPlot, selectPlots } from '../../util/messages'
import { PlotsState } from '../../store'
import { WaitForPlotsInfo } from '../emptyState/WaitForPlotsInfo'

export const NoPlotsToDisplay: React.FC = () => {
  const { hasUnselectedPlots } = useSelector(
    (state: PlotsState) => state.webview
  )
  return (
    <EmptyState isFullScreen={false}>
      <p>No Plots or Data to Display</p>
      <WaitForPlotsInfo />
      {hasUnselectedPlots ? (
        <div>
          <StartButton
            isNested={true}
            onClick={selectPlots}
            text="Select Plots"
          />
          <StartButton
            text="Add Plot"
            appearance="secondary"
            isNested={true}
            onClick={addPlot}
          />
        </div>
      ) : (
        <StartButton text="Add Plot" onClick={addPlot} />
      )}
    </EmptyState>
  )
}
