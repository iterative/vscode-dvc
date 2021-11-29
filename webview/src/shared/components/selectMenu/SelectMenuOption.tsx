import React, { useCallback } from 'react'
import styles from './styles.module.scss'
import { AllIcons, Icon } from '../icon/Icon'

export interface SelectMenuOptionProps {
  id: string
  label: string
  isSelected: boolean
}

interface SelectMenuOptionAllProps extends SelectMenuOptionProps {
  onClick: (id: string) => void
  index: number
}

export const SelectMenuOption: React.FC<SelectMenuOptionAllProps> = ({
  id,
  label,
  isSelected,
  onClick,
  index
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
      tabIndex={index}
      data-testid="select-menu-option"
    >
      <div className={styles.itemLabel} data-testid="select-menu-option-label">
        {label}
      </div>
      <div className={styles.itemIcon}>
        {isSelected && (
          <Icon
            name={AllIcons.CHECK}
            width={13}
            data-testid="select-menu-option-check"
          />
        )}
      </div>
    </div>
  )
}
