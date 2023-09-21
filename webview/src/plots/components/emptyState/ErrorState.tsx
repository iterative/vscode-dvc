import React from 'react'
import { EmptyState } from './EmptyState'
import { addPlot, refreshRevisions, selectRevisions } from '../../util/messages'
import { RefreshButton } from '../../../shared/components/button/RefreshButton'
import { StartButton } from '../../../shared/components/button/StartButton'
import { ErrorIcon } from '../../../shared/components/errorIcon/ErrorIcon'

export const ErrorState: React.FC<{
  cliError: string
  hasCustomPlots: boolean
  modal: React.ReactNode
}> = ({ cliError, hasCustomPlots, modal }) => (
  <EmptyState hasCustomPlots={hasCustomPlots} modal={modal}>
    <ErrorIcon error={cliError} size={96} />
    <p>No Plots to Display</p>
    <div>
      <StartButton onClick={selectRevisions} text="Add Experiments" />
      {!hasCustomPlots && (
        <StartButton
          isNested={true}
          appearance="secondary"
          onClick={addPlot}
          text="Add Custom Plot"
        />
      )}
      <RefreshButton
        onClick={refreshRevisions}
        isNested={true}
        appearance="secondary"
      />
    </div>
  </EmptyState>
)
