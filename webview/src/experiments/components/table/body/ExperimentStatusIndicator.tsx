import React from 'react'
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import cx from 'classnames'
import {
  ExperimentStatus,
  GitRemoteStatus,
  isRunning
} from 'dvc/src/experiments/webview/contract'
import { CellHintTooltip } from './CellHintTooltip'
import styles from '../styles.module.scss'
import { clickAndEnterProps } from '../../../../util/props'
import { pushExperiment } from '../../../util/messages'
import { Cloud, CloudUpload } from '../../../../shared/components/icons'
import { Icon } from '../../../../shared/components/Icon'

type ExperimentStatusIndicatorProps = {
  status: ExperimentStatus | undefined
  gitRemoteStatus: GitRemoteStatus | undefined
  id: string
}

export const ExperimentStatusIndicator: React.FC<
  ExperimentStatusIndicatorProps
> = ({ id, status, gitRemoteStatus }) => {
  if (isRunning(status) || gitRemoteStatus === GitRemoteStatus.PUSHING) {
    return (
      <VSCodeProgressRing className={cx(styles.running, 'chromatic-ignore')} />
    )
  }

  if (gitRemoteStatus === GitRemoteStatus.NOT_ON_REMOTE) {
    return (
      <CellHintTooltip
        tooltipContent={'Experiment not found on remote\nClick to push'}
      >
        <div
          className={styles.upload}
          {...clickAndEnterProps(() => pushExperiment(id))}
        >
          <Icon className={styles.cloudBox} icon={CloudUpload} />
        </div>
      </CellHintTooltip>
    )
  }

  if (gitRemoteStatus === GitRemoteStatus.ON_REMOTE) {
    return (
      <CellHintTooltip tooltipContent="Experiment on remote">
        <div className={styles.upload}>
          <Icon icon={Cloud} />
        </div>
      </CellHintTooltip>
    )
  }
}
