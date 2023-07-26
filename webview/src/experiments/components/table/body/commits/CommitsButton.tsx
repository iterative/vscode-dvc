import React from 'react'
import styles from './styles.module.scss'
import { Icon, IconValue } from '../../../../../shared/components/Icon'
import Tooltip from '../../../../../shared/components/tooltip/Tooltip'
export interface CommitsButtonProps {
  action: () => void
  disabled: boolean
  icon: IconValue
  tooltipContent: string
}

export const CommitsButton: React.FC<CommitsButtonProps> = ({
  action,
  disabled,
  icon,
  tooltipContent
}) => {
  return (
    <Tooltip content={tooltipContent}>
      <button
        className={styles.commitsButton}
        onClick={action}
        disabled={disabled}
        aria-label={tooltipContent}
      >
        <Icon icon={icon} className={styles.commitsIcon} />
      </button>
    </Tooltip>
  )
}
