import React from 'react'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import { saveStudioToken, removeStudioToken } from '../messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'

export const Settings: React.FC<{
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
