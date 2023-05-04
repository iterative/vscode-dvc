import React from 'react'
import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'
import { SectionDescription } from './SectionContainer'
import Tooltip from '../tooltip/Tooltip'
import { Icon } from '../Icon'
import { Info, PassFilled, Error, Pass } from '../icons'

export enum TooltipIconType {
  PASSED = 'pass-filled',
  INFO = 'info',
  ERROR = 'error',
  INCOMPLETE = 'pass'
}

const getIcon = (icon?: TooltipIconType) => {
  const props = {
    className: styles.infoIcon,
    height: 16,
    icon: Info,
    width: 16
  }

  if (icon === TooltipIconType.ERROR) {
    props.icon = Error
    props.className = cx(styles.infoIcon, styles.errorIcon)
  }

  if (icon === TooltipIconType.INCOMPLETE) {
    props.icon = Pass
    props.className = cx(styles.infoIcon, styles.incompleteIcon)
  }

  if (icon === TooltipIconType.PASSED) {
    props.icon = PassFilled
    props.className = cx(styles.infoIcon, styles.completedIcon)
  }

  return <Icon {...props} />
}

export const InfoTooltip: React.FC<{
  sectionKey: PlotsSection | SetupSection
  icon?: TooltipIconType
}> = ({ icon, sectionKey }) => {
  const infoIcon = getIcon(icon)

  const tooltipContent = (
    <div className={styles.infoTooltip}>
      {infoIcon}
      {SectionDescription[sectionKey]}
    </div>
  )

  return (
    <Tooltip
      content={tooltipContent}
      placement="bottom-end"
      interactive
      appendTo={document.body}
    >
      <div
        className={styles.infoTooltipToggle}
        data-testid="info-tooltip-toggle"
      >
        {infoIcon}
      </div>
    </Tooltip>
  )
}
