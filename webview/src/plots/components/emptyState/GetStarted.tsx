import React from 'react'
import { AddPlots } from './AddPlots'
import { Welcome } from './Welcome'
import { EmptyState } from './EmptyState'

type GetStartedProps = {
  hasCustomPlots: boolean
  hasPlots: boolean
  hasUnselectedPlots: boolean
  modal: React.ReactNode
}

export const GetStarted: React.FC<GetStartedProps> = ({
  hasCustomPlots,
  hasPlots,
  hasUnselectedPlots,
  modal
}) => (
  <EmptyState hasCustomPlots={hasCustomPlots} modal={modal}>
    {hasPlots ? (
      <AddPlots
        hasUnselectedPlots={hasUnselectedPlots}
        hasCustomPlots={hasCustomPlots}
      />
    ) : (
      <Welcome />
    )}
  </EmptyState>
)
