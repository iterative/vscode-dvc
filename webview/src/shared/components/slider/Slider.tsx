import React, { FormEvent, InputHTMLAttributes } from 'react'
import styles from './styles.module.scss'

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  onValueChange: (newValue: number) => void
}

export const Slider: React.FC<SliderProps> = ({
  label,
  onValueChange,
  ...props
}) => {
  const handleOnChange = (e: FormEvent<HTMLInputElement>) => {
    onValueChange(Number.parseFloat(e.currentTarget.value))
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
        {...props}
      />
    </div>
  )
}
