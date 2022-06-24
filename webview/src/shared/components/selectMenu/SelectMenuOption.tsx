import React, { useCallback } from 'react'
import styles from './styles.module.scss'
import { Icon } from '../Icon'
import { Check } from '../icons'

export interface SelectMenuOptionProps {
  id: string
  label: string
  isSelected?: boolean
}

interface SelectMenuOptionAllProps extends SelectMenuOptionProps {
  onClick: (id: string) => void
  index: number
}

export const SelectMenuOption: React.FC<SelectMenuOptionAllProps> = ({
  id,
  label,
  isSelected,
  onClick
}) => {
  const memoizedOnClick = useCallback(() => onClick(id), [id, onClick])
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) =>
      e.key === 'Enter' && memoizedOnClick(),
    [memoizedOnClick]
  )
  return (
    <div
      className={styles.item}
      onClick={memoizedOnClick}
      onKeyDown={onKeyDown}
      role="menuitemcheckbox"
      aria-checked={isSelected}
      data-testid="select-menu-option"
      tabIndex={0}
    >
      <div className={styles.itemLabel} data-testid="select-menu-option-label">
        {label}
      </div>
      <div className={styles.itemIcon}>
        {isSelected && (
          <Icon
            icon={Check}
            width={13}
            data-testid="select-menu-option-check"
          />
        )}
      </div>
    </div>
  )
}
