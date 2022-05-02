import React from 'react'
import { AllIcons, Icon } from '../Icon'

interface GripIconProps {
  className: string
}

export const GripIcon: React.FC<GripIconProps> = ({ className }) => (
  <Icon icon={AllIcons.GRIPPER} width={30} height={30} className={className} />
)
