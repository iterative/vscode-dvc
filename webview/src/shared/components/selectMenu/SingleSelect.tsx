import React, { useState } from 'react'
import { SelectMenu } from './SelectMenu'
import { SelectMenuOptionProps } from './SelectMenuOption'

export const SingleSelect: React.FC<{
  items: SelectMenuOptionProps[]
  setSelected: (selected: string) => void
}> = ({ items, setSelected }) => {
  const [options, setOptions] = useState<SelectMenuOptionProps[]>(items)
  const onClick = (id: string) => {
    setOptions(
      options.map(option => ({ ...option, isSelected: option.id === id }))
    )
    setSelected(id)
  }
  return <SelectMenu options={options} onClick={onClick} />
}
