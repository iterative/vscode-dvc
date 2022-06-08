import React from 'react'
import {
  Add,
  Check,
  ChevronDown,
  ChevronRight,
  Close,
  Dots,
  DownArrow,
  Ellipsis,
  GraphLine,
  Gripper,
  Info,
  Lines,
  Refresh,
  UpArrow
} from './icons'

export const AllIcons = {
  ADD: Add,
  CHECK: Check,
  CHEVRON_DOWN: ChevronDown,
  CHEVRON_RIGHT: ChevronRight,
  CLOSE: Close,
  DOTS: Dots,
  DOWN_ARROW: DownArrow,
  ELLIPSIS: Ellipsis,
  GRAPH_LINE: GraphLine,
  GRIPPER: Gripper,
  INFO: Info,
  LINES: Lines,
  REFRESH: Refresh,
  UP_ARROW: UpArrow
}

type IconKeys = keyof typeof AllIcons
export type IconValues = typeof AllIcons[IconKeys]

interface IconProps {
  icon: IconValues
  className?: string
  width?: number
  height?: number
}

export const Icon: React.FC<IconProps> = ({
  icon,
  width,
  height,
  ...other
}) => {
  const I = icon
  const fill = 'magenta' // This color is used to make sure we change it in CSS
  const w = width || 20
  const h = height || 20

  return <I fill={fill} width={w} height={h} {...other} />
}
