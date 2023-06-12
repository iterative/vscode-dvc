import React from 'react'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { ErrorIcon } from '../../../shared/components/errorIcon/ErrorIcon'
import { RefreshButton } from '../../../shared/components/button/RefreshButton'
import { refreshData } from '../../util/messages'

export const ErrorState: React.FC<{ cliError: string }> = ({ cliError }) => (
  <EmptyState>
    <ErrorIcon error={cliError} size={96} />
    <p>No Experiments to Display.</p>
    <RefreshButton onClick={refreshData} />
  </EmptyState>
)
