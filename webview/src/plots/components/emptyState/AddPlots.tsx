import React from 'react'
import {
  addCustomPlot,
  selectPlots,
  selectRevisions
} from '../../util/messages'
import { StartButton } from '../../../shared/components/button/StartButton'

type AddPlotsProps = {
  hasCustomPlots: boolean
  hasUnselectedPlots: boolean
}

export const AddPlots: React.FC<AddPlotsProps> = ({
  hasCustomPlots,
  hasUnselectedPlots
}: AddPlotsProps) => (
  <div>
    <p>No Plots to Display</p>
    <div>
      <StartButton onClick={selectRevisions} text="Add Experiments" />
      {hasUnselectedPlots && (
        <StartButton
          isNested={true}
          appearance="secondary"
          onClick={selectPlots}
          text="Add Plots"
        />
      )}
      {!hasCustomPlots && (
        <StartButton
          isNested={true}
          appearance="secondary"
          onClick={addCustomPlot}
          text="Add Custom Plot"
        />
      )}
    </div>
  </div>
)
