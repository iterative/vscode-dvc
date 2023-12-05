import React from 'react'
import { DEFAULT_STUDIO_URL } from 'dvc/src/setup/webview/contract'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { requestStudioToken, saveStudioToken } from '../../util/messages'
import { Button } from '../../../shared/components/button/Button'

export const Connect: React.FC = () => {
  return (
    <EmptyState isFullScreen={false}>
      <div>
        <h1>
          Connect to <a href={DEFAULT_STUDIO_URL}>Studio</a>
        </h1>
        <p>
          Share experiments and plots with collaborators directly from your IDE.
          Start sending data with an{' '}
          <a href="https://dvc.org/doc/studio/user-guide/projects-and-experiments/live-metrics-and-plots#set-up-an-access-token">
            access token
          </a>{' '}
          generated from your Studio profile page. Request a token below or add
          an already created one.
        </p>
        <div>
          <Button isNested text="Get Token" onClick={requestStudioToken} />
          <Button
            isNested
            appearance="secondary"
            text="Save Created Token"
            onClick={saveStudioToken}
          />
        </div>
        <p>
          Don&apos;t Have an account?{' '}
          <a href={DEFAULT_STUDIO_URL}>Get Started</a>
        </p>
      </div>
    </EmptyState>
  )
}
