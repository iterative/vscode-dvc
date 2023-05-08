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

export const TooltipIconTypeConst = {
  PASSED: PassFilled
}

const getIcon = (iconType: TooltipIconType = TooltipIconType.INFO) => {
  const defaultProps = {
    'data-testid': iconType,
    height: 16,
    width: 16
  }

  if (iconType === TooltipIconType.ERROR) {
    return (
      <Icon
        {...defaultProps}
        icon={Error}
        className={cx(styles.infoIcon, styles.errorIcon)}
      />
    )
  }

  if (iconType === TooltipIconType.PASSED) {
    return (
      <Icon
        {...defaultProps}
        icon={PassFilled}
        className={cx(styles.infoIcon, styles.completedIcon)}
      />
    )
  }

  return <Icon {...defaultProps} icon={Info} className={styles.infoIcon} />
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
