import React, { FormEvent, MouseEvent } from 'react'
import styles from './styles.module.scss'

interface SliderProps {
  minimum?: number
  maximum: number
  step?: number
  defaultValue: number
  label: string
  onChange: (newValue: number) => void
}

export const Slider: React.FC<SliderProps> = ({
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
    <div className={styles.wrapper}>
      <label htmlFor={label} className={styles.label}>
        {label}
      </label>
      <input
        type="range"
        id={label}
        className={styles.slider}
        onChange={handleOnChange}
        onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
        min={minimum}
        max={maximum}
        step={step}
        defaultValue={defaultValue}
      />
    </div>
  )
}
