import React from 'react'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { STUDIO_URL } from 'dvc/src/setup/webview/contract'
import {
  openStudio,
  openStudioProfile,
  saveStudioToken,
  removeStudioToken
} from './messages'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { Button } from '../../shared/components/button/Button'

const Connect: React.FC = () => {
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

const Settings: React.FC<{
  shareLiveToStudio: boolean
  setShareLiveToStudio: (shareLiveToStudio: boolean) => void
}> = ({ shareLiveToStudio, setShareLiveToStudio }) => {
  return (
    <EmptyState isFullScreen={false}>
      <div>
        <h1>Studio Settings</h1>
        <p>
          Experiment metrics and plots logged with DVCLive <br />
          can be{' '}
          <a href="https://dvc.org/doc/studio/user-guide/projects-and-experiments/live-metrics-and-plots#send-and-view-live-metrics-and-plots">
            automatically shared to Studio
          </a>
          .
        </p>
        <p>
          <VSCodeCheckbox
            onClick={() => setShareLiveToStudio(!shareLiveToStudio)}
            checked={shareLiveToStudio}
          >
            Share New Experiments Live
          </VSCodeCheckbox>
        </p>
        <Button
          appearance="primary"
          isNested={false}
          text="Update Token"
          onClick={saveStudioToken}
        />
        <Button
          appearance="secondary"
          isNested={true}
          text="Disconnect"
          onClick={removeStudioToken}
        />
      </div>
    </EmptyState>
  )
}

export const Studio: React.FC<{
  isStudioConnected: boolean
  shareLiveToStudio: boolean
  setShareLiveToStudio: (shareLiveToStudio: boolean) => void
}> = ({ isStudioConnected, shareLiveToStudio, setShareLiveToStudio }) => {
  return isStudioConnected ? (
    <Settings
      shareLiveToStudio={shareLiveToStudio}
      setShareLiveToStudio={setShareLiveToStudio}
    />
  ) : (
    <Connect />
  )
}
