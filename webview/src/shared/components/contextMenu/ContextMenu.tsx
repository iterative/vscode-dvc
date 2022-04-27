import React from 'react'
import Tooltip from '../tooltip/Tooltip'

export interface ContextMenuProps {
  open: boolean
  children?: React.ReactElement
  content?: React.ReactNode
  disabled?: boolean
  onClickOutside?: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  disabled,
  open,
  onClickOutside,
  content
}) => (
  <Tooltip
    visible={open}
    placement={'bottom'}
    interactive
    disabled={disabled}
    content={content}
    onClickOutside={onClickOutside}
  >
    {children}
  </Tooltip>
)
