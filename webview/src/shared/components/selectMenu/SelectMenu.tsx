import React from 'react'
import { SelectMenuOption, SelectMenuOptionProps } from './SelectMenuOption'

export interface SelectMenuProps {
  options: SelectMenuOptionProps[]
  onClick: (id: string) => void
  selectedImage: string
}

export const SelectMenu: React.FC<SelectMenuProps> = ({
  options,
  onClick,
  selectedImage
}) => (
  <div role="menu">
    {options.map((option, i) => (
      <SelectMenuOption
        key={option.id}
        {...option}
        onClick={onClick}
        selectedImage={selectedImage}
        index={i}
      />
    ))}
  </div>
)
