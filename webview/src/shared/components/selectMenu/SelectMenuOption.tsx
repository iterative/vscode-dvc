import React, { useCallback } from 'react'
import styles from './styles.module.scss'

export interface SelectMenuOptionProps {
  id: string
  label: string
  isSelected: boolean
}

interface SelectMenuOptionAllProps extends SelectMenuOptionProps {
  onClick: (id: string) => void
  selectedImage: string
  index: number
}

export const SelectMenuOption: React.FC<SelectMenuOptionAllProps> = ({
  id,
  label,
  isSelected,
  onClick,
  selectedImage,
  index
}) => {
  const memoizedOnClick = useCallback(() => onClick(id), [id, onClick])
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => e.key === 'Enter' && memoizedOnClick(),
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
      {isSelected && (
        <img
          data-testid="select-menu-option-check"
          src={selectedImage}
          alt="selected"
        />
      )}
    </div>
  )
}
