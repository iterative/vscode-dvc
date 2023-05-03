import React from 'react'
import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { SetupSection } from 'dvc/src/setup/webview/contract'
import styles from './styles.module.scss'
import { SectionDescription } from './SectionContainer'
import Tooltip from '../tooltip/Tooltip'
import { Icon } from '../Icon'
import { Info, PassFilled, Pass } from '../icons'

const getIcon = (isComplete?: boolean) => {
  const commonProps = {
    height: 16,
    width: 16
  }

  if (isComplete === false) {
    return (
      <Icon
        {...commonProps}
        icon={Pass}
        className={cx(styles.infoIcon, styles.incompletedIcon)}
      />
    )
  }

  if (isComplete === true) {
    return (
      <Icon
        {...commonProps}
        icon={PassFilled}
        className={cx(styles.infoIcon, styles.completedIcon)}
      />
    )
  }

  return <Icon {...commonProps} icon={Info} className={styles.infoIcon} />
}

export const InfoTooltip: React.FC<{
  sectionKey: PlotsSection | SetupSection
  isComplete?: boolean
}> = ({ isComplete, sectionKey }) => {
  const infoIcon = getIcon(isComplete)

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
