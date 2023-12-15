import React from 'react'
import { CopyStudioLink } from './CopyStudioLink'
import { CellHintTooltip } from './CellHintTooltip'
import styles from '../styles.module.scss'
import { Icon } from '../../../../shared/components/Icon'
import { Cloud } from '../../../../shared/components/icons'

export const OnRemote: React.FC<{ id: string; showLinkIcon: boolean }> = ({
  id,
  showLinkIcon
}) => {
  if (showLinkIcon) {
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
