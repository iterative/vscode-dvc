import React, { useEffect } from 'react'
import { AddColumns } from './AddColumns'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { redirectToSetup } from '../../util/messages'

export const GetStarted: React.FC<{ noExpsToDisplay: boolean }> = ({
  noExpsToDisplay
}) => {
  useEffect(() => {
    if (noExpsToDisplay) {
      redirectToSetup()
    }
  }, [noExpsToDisplay])

  return (
    <EmptyState>
      {noExpsToDisplay ? (
        <span>No experiments to display. Redirecting to setup...</span>
      ) : (
        <AddColumns />
      )}
    </EmptyState>
  )
}
