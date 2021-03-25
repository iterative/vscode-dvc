import React, { MouseEventHandler } from 'react'
import cn from 'classnames'
import styles from './styles.module.scss'

export interface ButtonProps {
  onClick?: MouseEventHandler
  pressed?: boolean
  small?: boolean
  large?: boolean
}

export interface TabButtonProps extends ButtonProps {
  active?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  pressed,
  small,
  large,
  children
}) => {
  return (
    <button
      className={cn(styles.button, {
        [styles.button__small]: small,
        [styles.button__large]: large,
        [styles.pressed]: pressed
      })}
      onClick={onClick}
    >
      {' '}
      {children}{' '}
    </button>
  )
}

export const TabButton: React.FC<TabButtonProps> = ({
  onClick,
  pressed,
  small,
  large,
  active,
  children
}) => {
  return (
    <button
      className={cn(styles.button, styles.button__tab, {
        [styles.button__small]: small,
        [styles.button__large]: large,
        [styles.pressed]: pressed,
        [styles.active]: active
      })}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
