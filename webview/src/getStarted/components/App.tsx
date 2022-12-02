import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { useVsCodeMessaging } from '../../shared/hooks/useVsCodeMessaging'

export const App: React.FC = () => {
  useVsCodeMessaging(() => {})

  return (
    <EmptyState>
      <div>
        <h1>DVC is not available or not initialized</h1>
      </div>
    </EmptyState>
  )
}
