import React, { FormEvent } from 'react'
import styles from './styles.module.scss'

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
    <div className={styles.wrapper}>
      <label htmlFor={label} className={styles.label}>
        {label}
      </label>
      <input
        type="range"
        min={minimum}
        max={maximum}
        step={step}
        defaultValue={defaultValue}
        id={label}
        onChange={handleOnChange}
        className={styles.slider}
      />
    </div>
  )
}
