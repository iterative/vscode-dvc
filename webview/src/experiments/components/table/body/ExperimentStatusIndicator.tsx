import React, { useEffect, useRef, useState } from 'react'
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import {
  ExecutorStatus,
  GitRemoteStatus,
  isRunning
} from 'dvc/src/experiments/webview/contract'
import { CellHintTooltip } from './CellHintTooltip'
import styles from '../styles.module.scss'
import { clickAndEnterProps } from '../../../../util/props'
import { copyStudioLink, pushExperiment } from '../../../util/messages'
import { Cloud, CloudUpload, Link } from '../../../../shared/components/icons'
import { Icon } from '../../../../shared/components/Icon'
import { ExperimentsState } from '../../../store'

type ExperimentStatusIndicatorProps = {
  executorStatus: ExecutorStatus | undefined
  gitRemoteStatus: GitRemoteStatus | undefined
  id: string
}

const Progress: React.FC = () => (
  <VSCodeProgressRing className={cx(styles.running, 'chromatic-ignore')} />
)

const CopyStudioLink: React.FC<{ id: string }> = ({ id }) => {
  const [copying, setCopying] = useState<boolean>()
  const timer = useRef<number>()

  useEffect(
    () => () => {
      if (timer.current) {
        window.clearTimeout(timer.current)
      }
    },
    []
  )

  if (copying) {
    return <Progress />
  }

  return (
    <CellHintTooltip
      tooltipContent={'Experiment on remote\nClick to copy Studio link'}
    >
      <div
        className={styles.upload}
        {...clickAndEnterProps(() => {
          setCopying(true)
          if (timer.current) {
            window.clearTimeout(timer.current)
          }
          timer.current = window.setTimeout(() => {
            setCopying(false)
          }, 1000)
          return copyStudioLink(id)
        })}
      >
        <Icon
          aria-label="Copy Experiment Link"
          className={styles.remoteStatusBox}
          icon={Link}
        />
      </div>
    </CellHintTooltip>
  )
}

const OnRemote: React.FC<{ id: string; isStudioConnected: boolean }> = ({
  id,
  isStudioConnected
}) => {
  if (isStudioConnected) {
    return <CopyStudioLink id={id} />
  }
  return (
    <CellHintTooltip tooltipContent="Experiment on remote">
      <div className={styles.upload}>
        <Icon className={styles.cloudIndicator} icon={Cloud} />
      </div>
    </CellHintTooltip>
  )
}

export const ExperimentStatusIndicator: React.FC<
  ExperimentStatusIndicatorProps
> = ({ id, executorStatus: status, gitRemoteStatus }) => {
  const { hasRunningWorkspaceExperiment, isStudioConnected } = useSelector(
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
    return <OnRemote id={id} isStudioConnected={isStudioConnected} />
  }
}
