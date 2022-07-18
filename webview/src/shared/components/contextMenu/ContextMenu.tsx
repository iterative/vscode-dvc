import React from 'react'
import { Instance } from 'tippy.js'
import Tooltip from '../tooltip/Tooltip'

const positionContextMenuAndDisableEvents = (
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

  const handleDefaultEvent = (e: Event) => {
    e.preventDefault()
  }

  instance.reference.removeEventListener('contextmenu', handleDefaultEvent)
  instance.reference.addEventListener('contextmenu', handleDefaultEvent)

  const hideOnClick = () => {
    instance.hide()
  }

  instance.popper.removeEventListener('click', hideOnClick)
  instance.popper.addEventListener('click', hideOnClick)
}

export interface ContextMenuProps {
  children: React.ReactElement
  content?: React.ReactNode
  disabled?: boolean
  onShow?: () => void
  trigger?: string
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  content,
  disabled,
  onShow,
  trigger = 'contextmenu'
}) => (
  <Tooltip
    arrow
    trigger={trigger}
    delay={[100, 200]}
    placement={'bottom'}
    interactive
    onTrigger={positionContextMenuAndDisableEvents}
    content={content}
    onShow={onShow}
    disabled={!content || disabled}
    appendTo={'parent'}
  >
    {children}
  </Tooltip>
)
