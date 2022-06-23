import React from 'react'
import styles from './styles.module.scss'
import {
  MessagesMenuOption,
  MessagesMenuOptionProps
} from './MessagesMenuOption'

export interface MessagesMenuProps {
  options: MessagesMenuOptionProps[]
  onOptionSelected?: () => void
}

export const MessagesMenu: React.FC<MessagesMenuProps> = ({
  options,
  onOptionSelected
}) => (
  <div className={styles.messagesMenu} role="menu" data-testid="messages-menu">
    {options
      .filter(({ hidden }) => !hidden)
      .map(option => (
        <MessagesMenuOption
          key={option.id}
          {...option}
          onOptionSelected={onOptionSelected}
        />
      ))}
  </div>
)
