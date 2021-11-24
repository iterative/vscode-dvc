import React from 'react'
import { Check } from '../icons'

const Icons = {
  CHECK: Check,
  OTHER: ''
}

type Icons = keyof typeof Icons

export enum AllIcons {
  CHECK = 'CHECK'
}

interface IconProps {
  name: Icons
  color?: string
  width?: number
  height?: number
}

export const Icon: React.FC<IconProps> = ({
  name,
  color,
  width,
  height,
  ...other
}) => {
  const I = Icons[name]
  const fill = color || '#252526' // Add theming later
  const w = width || 20
  const h = height || 20

  return <I fill={fill} width={w} height={h} {...other} />
}
