import React, { useEffect, useState } from 'react'
import { SelectMenu } from './SelectMenu'
import { SelectMenuOptionProps } from './SelectMenuOption'

export const MultiSelect: React.FC<{
  items: SelectMenuOptionProps[]
  setSelected: (selected: string[]) => void
}> = ({ items, setSelected }) => {
  const [options, setOptions] = useState<SelectMenuOptionProps[]>(items)
  const onClick = (id: string) => {
    setOptions(
      options.map(option =>
        option.id === id
          ? { ...option, isSelected: !option.isSelected }
          : option
      )
    )
  }
  useEffect(() => {
    setSelected(
      options.filter(option => option.isSelected).map(option => option.id)
    )
  }, [options, setSelected])
  return <SelectMenu options={options} onClick={onClick} />
}
