import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const App: React.FC = () => {
  return (
    <EmptyState>
      <div>
        <h1>DVC is not available or not initialized</h1>
      </div>
    </EmptyState>
  )
}
