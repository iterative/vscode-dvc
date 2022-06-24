import React from 'react'
import { Icon } from '../Icon'
import { Gripper } from '../icons'

interface GripIconProps {
  className: string
}

export const GripIcon: React.FC<GripIconProps> = ({ className }) => (
  <Icon icon={Gripper} width={30} height={30} className={className} />
)
