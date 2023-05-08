import React from 'react'
import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'
import { SectionDescription } from './SectionContainer'
import Tooltip from '../tooltip/Tooltip'
import { Icon, IconValue } from '../Icon'
import { Info, PassFilled, Error } from '../icons'

export enum TooltipIconType {
  PASSED = 'pass-filled',
  INFO = 'info',
  ERROR = 'error'
}

export const TooltipIconTypeConst = {
  PASSED: PassFilled
}

const getIconProps = (
  iconType: TooltipIconType,
  icon: IconValue,
  className?: string
) => ({
  className: cx(styles.infoIcon, className),
  'data-testid': iconType,
  height: 16,
  icon,
  width: 16
})

const getIcon = (iconType: TooltipIconType = TooltipIconType.INFO) => {
  if (iconType === TooltipIconType.ERROR) {
    return <Icon {...getIconProps(iconType, Error, styles.errorIcon)} />
  }

  if (iconType === TooltipIconType.PASSED) {
    return (
      <Icon {...getIconProps(iconType, PassFilled, styles.completedIcon)} />
    )
  }

  return <Icon {...getIconProps(iconType, Info)} />
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
