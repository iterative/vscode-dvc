import React from 'react'
import { Button, ButtonProps } from './Button'
import { AllIcons, Icon } from '../Icon'

export const StartButton: React.FC<ButtonProps> = ({
  appearance,
  onClick,
  isNested,
  text
}: ButtonProps) => {
  return (
    <Button
      appearance={appearance}
      isNested={isNested}
      onClick={onClick}
      text={text}
    >
      <span slot="start">
        <Icon icon={AllIcons.ADD} width={18} height={18} />
      </span>
    </Button>
  )
}
