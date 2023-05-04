import React, { Dispatch, SetStateAction } from 'react'
import { Instance } from 'tippy.js'
import Tooltip from '../tooltip/Tooltip'

const positionContextMenuAndDisableEvents =
  (setHideOnClick: Dispatch<SetStateAction<(() => void) | undefined>>) =>
  (instance: Instance, event: PointerEvent) => {
    event.preventDefault()
    instance.setProps({
      getReferenceClientRect() {
        const { top, bottom, height } =
          instance.reference.getBoundingClientRect()
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

    setHideOnClick(() => hideOnClick)
  }

export interface ContextMenuProps {
  children: React.ReactElement
  content?: React.ReactNode
  disabled?: boolean
  setHideOnClick: Dispatch<SetStateAction<(() => void) | undefined>>
  onShow?: () => void
  onHide?: () => void
  trigger?: string
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  content,
  disabled,
  onShow,
  onHide,
  setHideOnClick,
  trigger = 'contextmenu'
}) => (
  <Tooltip
    trigger={trigger}
    delay={[100, 200]}
    placement="bottom-start"
    interactive
    isContextMenu={true}
    onTrigger={positionContextMenuAndDisableEvents(setHideOnClick)}
    onClickOutside={(instance: Instance) => instance.hide()}
    hideOnClick={false}
    content={content}
    onShow={onShow}
    onHide={onHide}
    disabled={!content || disabled}
    appendTo="parent"
    followCursor="initial"
    offset={[0, 0]}
  >
    {children}
  </Tooltip>
)
