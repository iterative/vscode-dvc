import React from 'react'
import { useSelector } from 'react-redux'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { saveStudioToken, removeStudioToken } from '../../util/messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { SetupState } from '../../store'

export const Settings: React.FC<{
  setShareLiveToStudio: (shareLiveToStudio: boolean) => void
}> = ({ setShareLiveToStudio }) => {
  const shareLiveToStudio = useSelector(
    (state: SetupState) => state.studio.shareLiveToStudio
  )

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
            Share New Experiments Live*
          </VSCodeCheckbox>
        </p>
        <p className={styles.smallFont}>
          *The checkbox reflects the{' '}
          <a href="https://dvc.org/doc/user-guide/project-structure/configuration#studio">
            studio.offline
          </a>{' '}
          config option.
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
