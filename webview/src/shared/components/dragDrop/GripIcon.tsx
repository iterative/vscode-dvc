import React from 'react'
import { AllIcons, Icon } from '../icon/Icon'

interface GripIconProps {
  className: string
}

export const GripIcon: React.FC<GripIconProps> = ({ className }) => (
  <Icon icon={AllIcons.GRIPPER} width={35} height={35} className={className} />
)
