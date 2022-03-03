import React from 'react'
import { getThemeValue, ThemeProperty } from '../../../util/styles'
import { AllIcons, Icon } from '../icon/Icon'

interface GripIconProps {
  className: string
}

export const GripIcon: React.FC<GripIconProps> = ({ className }) => (
  <Icon
    icon={AllIcons.GRIPPER}
    color={getThemeValue(ThemeProperty.FOREGROUND_COLOR)}
    width={35}
    height={35}
    className={className}
  />
)
