import React, { FormEvent } from 'react'
import { Slider } from './Slider'

interface MinMaxSliderProps {
  minimum?: number
  maximum: number
  step?: number
  defaultValue: number
  label: string
  onChange: (newValue: number) => void
}

export const MinMaxSlider: React.FC<MinMaxSliderProps> = ({
  minimum,
  maximum,
  step,
  defaultValue,
  label,
  onChange
}) => {
  const handleOnChange = (e: FormEvent<HTMLInputElement>) => {
    onChange(Number.parseFloat(e.currentTarget.value))
  }

  return (
    <Slider
      min={minimum}
      max={maximum}
      step={step}
      defaultValue={defaultValue}
      onChange={handleOnChange}
      label={label}
    />
  )
}
