import React from 'react'
import { Check, Dots, DownArrow, Lines, Pencil, UpArrow } from '../icons'

const Icons = {
  CHECK: Check,
  DOTS: Dots,
  DOWN_ARROW: DownArrow,
  LINES: Lines,
  PENCIL: Pencil,
  UP_ARROW: UpArrow
}

export type Icons = keyof typeof Icons

export enum AllIcons {
  CHECK = 'CHECK',
  DOTS = 'DOTS',
  DOWN_ARROW = 'DOWN_ARROW',
  LINES = 'LINES',
  PENCIL = 'PENCIL',
  UP_ARROW = 'UP_ARROW'
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
