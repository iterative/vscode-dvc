import React, { useEffect, useRef, useState } from 'react'
import { StudioLinkType } from 'dvc/src/experiments/webview/contract'
import { CellHintTooltip } from './CellHintTooltip'
import { Progress } from './Progress'
import styles from '../styles.module.scss'
import { clickAndEnterProps } from '../../../../util/props'
import { copyStudioLink } from '../../../util/messages'
import { Icon } from '../../../../shared/components/Icon'
import { Link } from '../../../../shared/components/icons'

export const CopyStudioLink: React.FC<{ id: string }> = ({ id }) => {
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
      tooltipContent={'Experiment on remote\nClick to copy DVC Studio link'}
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
          return copyStudioLink(id, StudioLinkType.PUSHED)
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
