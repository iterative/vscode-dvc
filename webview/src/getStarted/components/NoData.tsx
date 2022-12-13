import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const NoData: React.FC = () => {
  return (
    <EmptyState>
      <div>
        <h1>Your project contains no data</h1>
      </div>
    </EmptyState>
  )
}
