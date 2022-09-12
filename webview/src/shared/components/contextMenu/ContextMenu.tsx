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
    !instance.state.isDestroyed && instance.hide()
  }

  instance.popper.removeEventListener('click', hideOnClick)
  instance.popper.addEventListener('click', hideOnClick)

  window.addEventListener('click', hideOnClick, { once: true })
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
    trigger={trigger}
    delay={[100, 200]}
    placement={'bottom-start'}
    interactive
    isContextMenu={true}
    onTrigger={positionContextMenuAndDisableEvents}
    onClickOutside={(instance: Instance) => instance.hide()}
    hideOnClick={false}
    content={content}
    onShow={onShow}
    disabled={!content || disabled}
    appendTo={'parent'}
    followCursor={'initial'}
  >
    {children}
  </Tooltip>
)
