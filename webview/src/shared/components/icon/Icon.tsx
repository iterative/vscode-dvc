import React from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Dots,
  DownArrow,
  Gripper,
  Lines,
  Pencil,
  UpArrow
} from '../icons'

export const AllIcons = {
  CHECK: Check,
  CHEVRON_DOWN: ChevronDown,
  CHEVRON_RIGHT: ChevronRight,
  DOTS: Dots,
  DOWN_ARROW: DownArrow,
  GRIPPPER: Gripper,
  LINES: Lines,
  PENCIL: Pencil,
  UP_ARROW: UpArrow
}

type IconKeys = keyof typeof AllIcons
export type IconValues = typeof AllIcons[IconKeys]

interface IconProps {
  icon: IconValues
  className?: string
  color?: string
  width?: number
  height?: number
}

export const Icon: React.FC<IconProps> = ({
  icon,
  color,
  width,
  height,
  ...other
}) => {
  const I = icon
  const fill = color || '#252526' // Add theming later
  const w = width || 20
  const h = height || 20

  return <I fill={fill} width={w} height={h} {...other} />
}
