import React from 'react'
import styles from './styles.module.scss'
import { Icon, IconValue } from '../../../../../shared/components/Icon'
import { Add, Remove } from '../../../../../shared/components/icons'
import Tooltip from '../../../../../shared/components/tooltip/Tooltip'

type CommitsButtonType = {
  icon: IconValue
  moreOrLess: 'More' | 'Less'
}

export const CommitsButtonType: { [key: string]: CommitsButtonType } = {
  LESS: {
    icon: Remove,
    moreOrLess: 'Less'
  },
  MORE: {
    icon: Add,
    moreOrLess: 'More'
  }
}

interface CommitsButtonProps {
  type: CommitsButtonType
  action: () => void
  disabled?: boolean
}

export const CommitsButton: React.FC<CommitsButtonProps> = ({
  type,
  action,
  disabled
}) => {
  const text = `Show ${type.moreOrLess} Commits`
  return (
    <Tooltip content={<>{text}</>}>
      <button
        className={styles.commitsButton}
        onClick={action}
        disabled={disabled}
        aria-label={text}
      >
        <Icon icon={type.icon} className={styles.commitsIcon} />
      </button>
    </Tooltip>
  )
}
