import React from 'react'
import { addPlot, selectPlots, selectRevisions } from '../../util/messages'
import { StartButton } from '../../../shared/components/button/StartButton'

type AddPlotsProps = {
  hasUnselectedPlots: boolean
}

export const AddPlots: React.FC<AddPlotsProps> = ({
  hasUnselectedPlots
}: AddPlotsProps) => (
  <div>
    <p>No Plots to Display</p>
    <div>
      <StartButton onClick={selectRevisions} text="Add Experiments" />
      {hasUnselectedPlots ? (
        <StartButton
          isNested={true}
          appearance="secondary"
          onClick={selectPlots}
          text="Select Plots"
        />
      ) : (
        <StartButton
          isNested={true}
          appearance="secondary"
          onClick={addPlot}
          text="Add Plot"
        />
      )}
    </div>
  </div>
)
