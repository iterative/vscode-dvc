import React, { PropsWithChildren } from 'react'
import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'
import { SectionDescription } from './SectionDescription'
import Tooltip from '../tooltip/Tooltip'
import { Info, PassFilled, Error, Warning } from '../icons'
import { Icon } from '../Icon'

export enum TooltipIconType {
  PASSED = 'pass-filled',
  INFO = 'info',
  ERROR = 'error',
  WARNING = 'warning'
}

const tooltipIcons = {
  [TooltipIconType.PASSED]: PassFilled,
  [TooltipIconType.INFO]: Info,
  [TooltipIconType.ERROR]: Error,
  [TooltipIconType.WARNING]: Warning
}

export const InfoTooltip: React.FC<
  PropsWithChildren<{
    sectionKey: PlotsSection | SetupSection
    icon?: TooltipIconType
  }>
> = ({ icon = TooltipIconType.INFO, sectionKey, children }) => {
  const infoIcon = (
    <Icon
      data-testid={icon}
      width={16}
      height={16}
      icon={tooltipIcons[icon]}
      className={cx(
        styles.infoIcon,
        icon === TooltipIconType.ERROR && styles.errorIcon,
        icon === TooltipIconType.PASSED && styles.completedIcon,
        icon === TooltipIconType.WARNING && styles.warningIcon
      )}
    />
  )

  const tooltipContent = (
    <div className={styles.infoTooltip}>
      {infoIcon}
      <SectionDescription sectionKey={sectionKey}>
        {children}
      </SectionDescription>
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
