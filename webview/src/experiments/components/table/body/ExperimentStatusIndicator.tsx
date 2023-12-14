import React from 'react'
import { useSelector } from 'react-redux'
import {
  ExecutorStatus,
  GitRemoteStatus,
  StudioLinkType,
  isRunning
} from 'dvc/src/experiments/webview/contract'
import { CellHintTooltip } from './CellHintTooltip'
import { Progress } from './Progress'
import { OnRemote } from './OnRemote'
import styles from '../styles.module.scss'
import { clickAndEnterProps } from '../../../../util/props'
import { pushExperiment } from '../../../util/messages'
import { CloudUpload } from '../../../../shared/components/icons'
import { Icon } from '../../../../shared/components/Icon'
import { ExperimentsState } from '../../../store'

type ExperimentStatusIndicatorProps = {
  executorStatus: ExecutorStatus | undefined
  gitRemoteStatus: GitRemoteStatus | undefined
  id: string
  studioLinkType: StudioLinkType | undefined
}

export const ExperimentStatusIndicator: React.FC<
  ExperimentStatusIndicatorProps
> = ({ id, executorStatus: status, gitRemoteStatus, studioLinkType }) => {
  const { hasRunningWorkspaceExperiment } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  if (isRunning(status) || gitRemoteStatus === GitRemoteStatus.PUSHING) {
    return <Progress />
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
            aria-label="Push Experiment"
            aria-disabled={false}
            className={styles.remoteStatusBox}
            icon={CloudUpload}
          />
        </div>
      </CellHintTooltip>
    )
  }

  if (gitRemoteStatus === GitRemoteStatus.ON_REMOTE) {
    return (
      <OnRemote
        id={id}
        showLinkIcon={studioLinkType === StudioLinkType.PUSHED}
      />
    )
  }
}
