import React from 'react'
import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'
import { SectionDescription } from './SectionContainer'
import Tooltip from '../tooltip/Tooltip'
import { Icon } from '../Icon'
import { Info, PassFilled, Error } from '../icons'

export enum TooltipIconType {
  PASSED = 'pass-filled',
  INFO = 'info',
  ERROR = 'error'
}

const tooltipIcons = {
  [TooltipIconType.PASSED]: PassFilled,
  [TooltipIconType.INFO]: Info,
  [TooltipIconType.ERROR]: Error
}

export const InfoTooltip: React.FC<{
  sectionKey: PlotsSection | SetupSection
  icon?: TooltipIconType
}> = ({ icon = TooltipIconType.INFO, sectionKey }) => {
  const infoIcon = (
    <Icon
      data-testid={icon}
      width={16}
      height={16}
      icon={tooltipIcons[icon]}
      className={cx(
        styles.infoIcon,
        icon === TooltipIconType.ERROR && styles.errorIcon,
        icon === TooltipIconType.PASSED && styles.completedIcon
      )}
    />
  )

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
