import React from 'react'
import { useSelector } from 'react-redux'
import { STUDIO_URL } from 'dvc/src/setup/webview/contract'
import { requestStudioAuth, openStudioAuthLink } from '../../util/messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { SetupState } from '../../store'

export const Connect: React.FC = () => {
  const { studioUserCode } = useSelector((state: SetupState) => state.studio)
  return (
    <EmptyState isFullScreen={false}>
      <div data-testid="setup-studio-content">
        <h1>
          Connect to <a href={STUDIO_URL}>Studio</a>
        </h1>
        {studioUserCode ? (
          <>
            <p>
              We sent a token request to Studio. Enter the code shown below to
              verify your identity.
            </p>
            <p>{studioUserCode}</p>
            <Button
              appearance="secondary"
              text="Verify Identity"
              onClick={openStudioAuthLink}
            />
          </>
        ) : (
          <>
            <p>
              Share experiments and plots with collaborators directly from your
              IDE. Start sending data with an{' '}
              <a href="https://dvc.org/doc/studio/user-guide/projects-and-experiments/live-metrics-and-plots#set-up-an-access-token">
                access token
              </a>{' '}
              generated from your Studio profile page.
            </p>
            <Button
              appearance="secondary"
              text="Get Token"
              onClick={requestStudioAuth}
            />
          </>
        )}
        <p>
          Don&apos;t Have an account? <a href={STUDIO_URL}>Get Started</a>
        </p>
      </div>
    </EmptyState>
  )
}
