import React from 'react'
import { StartButton } from '../../../shared/components/button/StartButton'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { addCustomPlot } from '../../util/messages'

export const NoPlotsAdded: React.FC = () => {
  return (
    <EmptyState isFullScreen={false}>
      <p>No Plots Added</p>
      <StartButton onClick={addCustomPlot} text="Add Plot" />
    </EmptyState>
  )
}
