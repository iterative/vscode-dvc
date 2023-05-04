import React from 'react'
import styles from './styles.module.scss'
import {
  MessagesMenuOption,
  MessagesMenuOptionProps
} from './MessagesMenuOption'

export interface MessagesMenuProps {
  options: MessagesMenuOptionProps[]
  hideOnClick: (() => void) | undefined
  onOptionSelected?: () => void
}

export const MessagesMenu: React.FC<MessagesMenuProps> = ({
  hideOnClick,
  options,
  onOptionSelected
}) => (
  <div className={styles.messagesMenu} role="menu" data-testid="messages-menu">
    {options.map(option => (
      <MessagesMenuOption
        key={option.label}
        hideOnClick={hideOnClick}
        {...option}
        onOptionSelected={onOptionSelected}
      />
    ))}
  </div>
)
