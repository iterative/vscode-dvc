import React from 'react'
import { StartButton } from '../../../shared/components/button/StartButton'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { addPlot } from '../../util/messages'

export const NoPlotsAdded: React.FC = () => {
  return (
    <EmptyState isFullScreen={false}>
      <p>No Plots Added</p>
      <StartButton onClick={addPlot} text="Add Plot" />
    </EmptyState>
  )
}
