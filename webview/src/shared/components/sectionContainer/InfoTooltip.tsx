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
  [TooltipIconType.PASSED]: {
    className: styles.completedIcon,
    icon: PassFilled
  },
  [TooltipIconType.INFO]: { className: undefined, icon: Info },
  [TooltipIconType.ERROR]: { className: styles.errorIcon, icon: Error },
  [TooltipIconType.WARNING]: { className: styles.warningIcon, icon: Warning }
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
      icon={tooltipIcons[icon].icon}
      className={cx(styles.infoIcon, tooltipIcons[icon].className)}
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
