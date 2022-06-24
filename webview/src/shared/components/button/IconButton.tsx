import React from 'react'
import { Button, ButtonProps } from './Button'
import { Icon, IconValue } from '../Icon'

export type IconButtonProps = ButtonProps & { icon: IconValue }

export const IconButton: React.FC<IconButtonProps> = ({
  appearance,
  onClick,
  icon,
  isNested,
  text
}: IconButtonProps) => {
  return (
    <Button
      appearance={appearance}
      isNested={isNested}
      onClick={onClick}
      text={text}
    >
      <span slot="start">
        <Icon icon={icon} width={18} height={18} />
      </span>
    </Button>
  )
}
