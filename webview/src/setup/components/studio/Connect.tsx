import React from 'react'
import { STUDIO_URL } from 'dvc/src/setup/webview/contract'
import { openStudio, openStudioProfile, saveStudioToken } from '../messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'

export const Connect: React.FC = () => {
  return (
    <EmptyState isFullScreen={false}>
      <div data-testid="setup-studio-content">
        <h1>
          Connect to <a href={STUDIO_URL}>Studio</a>
        </h1>
        <p>
          Share experiments and plots with collaborators directly from your IDE.
        </p>
        <p>
          An{' '}
          <a href="https://dvc.org/doc/studio/user-guide/projects-and-experiments/live-metrics-and-plots#set-up-an-access-token">
            access token
          </a>{' '}
          can be generated from your Studio profile page.
        </p>
        <Button
          appearance="primary"
          isNested={false}
          text="Sign In"
          onClick={openStudio}
        />
        <Button
          appearance="secondary"
          isNested={true}
          text="Get Token"
          onClick={openStudioProfile}
        />
        <Button
          appearance="secondary"
          isNested={true}
          text="Save"
          onClick={saveStudioToken}
        />
        <p>
          {"Don't Have an account?\n"}
          <a href={STUDIO_URL}>Get Started</a>
        </p>
      </div>
    </EmptyState>
  )
}
