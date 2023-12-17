import React, { PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'
import styles from './styles.module.scss'
import { saveStudioToken, removeStudioToken } from '../../util/messages'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { Button } from '../../../shared/components/button/Button'
import { SetupState } from '../../store'

export const Settings: React.FC<
  PropsWithChildren<{
    setShareLiveToStudio: (shareLiveToStudio: boolean) => void
  }>
> = ({ children, setShareLiveToStudio }) => {
  const shareLiveToStudio = useSelector(
    (state: SetupState) => state.studio.shareLiveToStudio
  )

  return (
    <EmptyState isFullScreen={false}>
      <div>
        <h1>DVC Studio Settings</h1>
        {children}
        <div className={styles.studioSettings}>
          <div className={styles.checkboxWrapper}>
            <VSCodeCheckbox
              onClick={() => setShareLiveToStudio(!shareLiveToStudio)}
              checked={shareLiveToStudio}
              className={styles.checkbox}
            >
              <p>Share Experiments</p>
            </VSCodeCheckbox>
            <p className={styles.checkboxDescription}>
              Toggling the checkbox updates the{' '}
              <a href="https://dvc.org/doc/user-guide/project-structure/configuration#studio">
                studio.offline
              </a>{' '}
              config option. Experiment metrics and plots logged with DVCLive
              are{' '}
              <a href="https://dvc.org/doc/studio/user-guide/projects-and-experiments/live-metrics-and-plots#send-and-view-live-metrics-and-plots">
                automatically shared to Studio
              </a>{' '}
              unless studio.offline is set.
            </p>
          </div>
        </div>
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
