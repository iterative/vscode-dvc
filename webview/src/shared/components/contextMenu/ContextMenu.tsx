import React from 'react'
import { Instance } from 'tippy.js'
import Tooltip from '../tooltip/Tooltip'

const positionContextMenuOnTrigger = (
  instance: Instance,
  event: PointerEvent
) => {
  event.preventDefault()
  instance.setProps({
    getReferenceClientRect() {
      const { top, bottom, height } = instance.reference.getBoundingClientRect()
      return {
        bottom,
        height,
        left: event.clientX,
        right: event.clientX,
        top,
        width: 0
      } as DOMRect
    }
  })
}

export interface ContextMenuProps {
  children: React.ReactElement
  content: React.ReactNode
  disabled?: boolean
  onShow?: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  content,
  disabled,
  onShow
}) => (
  <Tooltip
    arrow
    trigger={'contextmenu'}
    placement={'bottom'}
    interactive
    onTrigger={positionContextMenuOnTrigger}
    content={content}
    onShow={onShow}
    disabled={disabled}
  >
    {children}
  </Tooltip>
)
