import React from 'react'
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
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
import { ExperimentsState } from '../../../store'

type ExperimentStatusIndicatorProps = {
  status: ExperimentStatus | undefined
  gitRemoteStatus: GitRemoteStatus | undefined
  id: string
}

export const ExperimentStatusIndicator: React.FC<
  ExperimentStatusIndicatorProps
> = ({ id, status, gitRemoteStatus }) => {
  const { hasRunningWorkspaceExperiment } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  if (isRunning(status) || gitRemoteStatus === GitRemoteStatus.PUSHING) {
    return (
      <VSCodeProgressRing className={cx(styles.running, 'chromatic-ignore')} />
    )
  }

  if (gitRemoteStatus === GitRemoteStatus.NOT_ON_REMOTE) {
    const tooltipContent =
      'Experiment not found on remote' +
      (hasRunningWorkspaceExperiment ? '' : '\nClick to push')

    return (
      <CellHintTooltip tooltipContent={tooltipContent}>
        <div
          className={styles.upload}
          {...clickAndEnterProps(
            () => !hasRunningWorkspaceExperiment && pushExperiment(id)
          )}
        >
          <Icon
            data-testid={`${id}-push-experiment`}
            aria-disabled={false}
            className={styles.cloudBox}
            icon={CloudUpload}
          />
        </div>
      </CellHintTooltip>
    )
  }

  if (gitRemoteStatus === GitRemoteStatus.ON_REMOTE) {
    return (
      <CellHintTooltip tooltipContent="Experiment on remote">
        <div className={styles.upload}>
          <Icon className={styles.cloudIndicator} icon={Cloud} />
        </div>
      </CellHintTooltip>
    )
  }
}
