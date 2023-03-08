import React, { InputHTMLAttributes } from 'react'
import styles from './styles.module.scss'

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Slider: React.FC<SliderProps> = ({ label, ...props }) => (
  <div className={styles.wrapper}>
    <label htmlFor={label} className={styles.label}>
      {label}
    </label>
    <input type="range" id={label} className={styles.slider} {...props} />
  </div>
)
