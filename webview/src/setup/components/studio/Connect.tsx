import React from 'react'
import { STUDIO_URL } from 'dvc/src/setup/webview/contract'
import { GetToken } from './GetToken'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const Connect: React.FC = () => {
  return (
    <EmptyState isFullScreen={false}>
      <div data-testid="setup-studio-content">
        <h1>
          Connect to <a href={STUDIO_URL}>Studio</a>
        </h1>
        <GetToken />
        <p>
          Don&apos;t Have an account? <a href={STUDIO_URL}>Get Started</a>
        </p>
      </div>
    </EmptyState>
  )
}
