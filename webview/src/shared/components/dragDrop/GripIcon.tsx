import React from 'react'
import { AllIcons, Icon } from '../icon/Icon'

interface GripIconProps {
  className: string
}

export const GripIcon: React.FC<GripIconProps> = ({ className }) => (
  <Icon
    icon={AllIcons.GRIPPER}
    color="#ffffff"
    width={30}
    height={30}
    className={className}
  />
)
