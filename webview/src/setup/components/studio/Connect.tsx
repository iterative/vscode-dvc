import React from 'react'
import { useSelector } from 'react-redux'
import { STUDIO_URL } from 'dvc/src/setup/webview/contract'
import { GetToken } from './GetToken'
import { VerifyIdentity } from './VerifyIdentity'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { SetupState } from '../../store'

export const Connect: React.FC = () => {
  const { studioVerifyUser } = useSelector((state: SetupState) => state.studio)
  return (
    <EmptyState isFullScreen={false}>
      <div data-testid="setup-studio-content">
        <h1>
          Connect to <a href={STUDIO_URL}>Studio</a>
        </h1>
        {studioVerifyUser ? <VerifyIdentity /> : <GetToken />}
        <p>
          Don&apos;t Have an account? <a href={STUDIO_URL}>Get Started</a>
        </p>
      </div>
    </EmptyState>
  )
}
