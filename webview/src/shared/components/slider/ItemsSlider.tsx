import React, { FormEvent } from 'react'
import { Slider } from './Slider'

interface ItemSliderProps {
  items: number[]
  defaultValue: number
  label: string
  onChange: (newValue: number) => void
}

export const ItemsSlider: React.FC<ItemSliderProps> = ({
  items,
  defaultValue,
  label,
  onChange
}) => {
  const handleOnChange = (e: FormEvent<HTMLInputElement>) => {
    onChange(Number.parseFloat(e.currentTarget.value))
  }

  return (
    <>
      <Slider
        min={items[0]}
        max={items.reverse()[0]}
        list="items"
        defaultValue={defaultValue}
        onChange={handleOnChange}
        label={label}
      />
      <datalist id="items">
        {items.map(item => (
          <option key={item} value={item}></option>
        ))}
      </datalist>
    </>
  )
}
