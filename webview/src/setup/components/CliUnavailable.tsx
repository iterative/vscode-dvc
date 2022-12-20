import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const CliUnavailable: React.FC = () => {
  return (
    <EmptyState>
      <div>
        <h1>DVC is currently unavailable</h1>
        <p>
          Take a look at the{' '}
          <a href="https://dvc.org/doc/install">documentation</a> to install the
          DVC cli on your system or inside a virtual environment.
        </p>
      </div>
    </EmptyState>
  )
}
