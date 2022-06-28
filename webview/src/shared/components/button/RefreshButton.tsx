import React from 'react'
import { ButtonProps } from './Button'
import { IconButton } from './IconButton'
import { Refresh } from '../icons'

type RefreshButtonProps = Omit<ButtonProps, 'text'>

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  appearance,
  onClick,
  isNested
}: RefreshButtonProps) => {
  return (
    <IconButton
      appearance={appearance}
      isNested={isNested}
      icon={Refresh}
      onClick={onClick}
      text={'Refresh'}
    />
  )
}
