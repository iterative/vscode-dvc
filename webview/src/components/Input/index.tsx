import React, { HTMLProps } from 'react'
import cn from 'classnames'
import styles from './styles.module.scss'

export interface InputProps extends HTMLProps<HTMLInputElement> {
  fullWidth?: boolean
}

export const Input: React.FC<InputProps> = ({
  className,
  fullWidth,
  ...rest
}) => {
  return (
    <input
      className={cn(styles.input, {
        [styles.input__fullWidth]: fullWidth
      })}
      {...rest}
    />
  )
}
