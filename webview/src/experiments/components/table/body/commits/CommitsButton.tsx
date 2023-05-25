import React from 'react'
import styles from './styles.module.scss'
import { Icon, IconValue } from '../../../../../shared/components/Icon'
import Tooltip from '../../../../../shared/components/tooltip/Tooltip'
export interface CommitsButtonProps {
  icon: IconValue
  moreOrLess: 'More' | 'Less'
  action: () => void
  disabled: boolean
}

export const CommitsButton: React.FC<CommitsButtonProps> = ({
  icon,
  moreOrLess,
  action,
  disabled
}) => {
  const text = `Show ${moreOrLess} Commits`
  return (
    <Tooltip content={<>{text}</>}>
      <button
        className={styles.commitsButton}
        onClick={action}
        disabled={disabled}
        aria-label={text}
      >
        <Icon icon={icon} className={styles.commitsIcon} />
      </button>
    </Tooltip>
  )
}
