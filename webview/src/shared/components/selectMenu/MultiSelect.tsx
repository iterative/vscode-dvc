import React, { useEffect, useState } from 'react'
import { SelectMenu } from './SelectMenu'
import { SelectMenuOptionProps } from './SelectMenuOption'

export const MultiSelect: React.FC<{
  items: SelectMenuOptionProps[]
  setSelected: (selected: string[]) => void
}> = ({ items, setSelected }) => {
  const [options, setOptions] = useState<SelectMenuOptionProps[]>(items)
  useEffect(() => {
    setOptions(items)
  }, [items])
  const onClick = (id: string) => {
    const rebuiltOptions = options.map(option =>
      option.id === id ? { ...option, isSelected: !option.isSelected } : option
    )
    setOptions(rebuiltOptions)
    setSelected(
      rebuiltOptions
        .filter(option => option.isSelected)
        .map(option => option.id)
    )
  }
  return <SelectMenu options={options} onClick={onClick} />
}
