import React from 'react'
import { SelectMenuOption, SelectMenuOptionProps } from './SelectMenuOption'

export interface SelectMenuProps {
  options: SelectMenuOptionProps[]
  onClick: (id: string) => void
}

export const SelectMenu: React.FC<SelectMenuProps> = ({ options, onClick }) => (
  <div role="menu">
    {options.map((option, i) => (
      <SelectMenuOption
        key={option.id}
        {...option}
        onClick={onClick}
        index={i}
      />
    ))}
  </div>
)
