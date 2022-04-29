import React from 'react'
import {
  MessagesMenuOption,
  MessagesMenuOptionProps
} from './MessagesMenuOption'

export interface MessagesMenuProps {
  options: MessagesMenuOptionProps[]
}

export const MessagesMenu: React.FC<MessagesMenuProps> = ({ options }) => (
  <div role="menu">
    {options.map((option, i) => (
      <MessagesMenuOption key={option.id} {...option} index={i} />
    ))}
  </div>
)
