import React from 'react'
import { ButtonProps } from './Button'
import { IconButton } from './IconButton'
import { Add } from '../icons'

export const StartButton: React.FC<ButtonProps> = ({
  appearance,
  onClick,
  isNested,
  text
}: ButtonProps) => {
  return (
    <IconButton
      appearance={appearance}
      isNested={isNested}
      icon={Add}
      onClick={onClick}
      text={text}
    />
  )
}
