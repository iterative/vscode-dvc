import React, { forwardRef, Ref } from 'react'
import Tippy, { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import 'tippy.js/dist/tippy.css'

export const HEADER_TOOLTIP_DELAY = 100
export const CELL_TOOLTIP_DELAY = 1000

const defaultModifiers = {
  modifiers: [
    {
      enabled: false,
      name: 'flip'
    },
    {
      name: 'computeStyles',
      options: {
        adaptive: false
      }
    }
  ]
}

const TooltipRenderFunction: React.ForwardRefRenderFunction<
  unknown,
  TippyProps
> = (
  {
    children,
    appendTo,
    content,
    delay,
    disabled,
    singleton,
    trigger,
    interactive,
    onShow,
    onHide,
    placement,
    onTrigger,
    onUntrigger,
    animation = false,
    className = styles.menu,
    arrow = false,
    popperOptions = defaultModifiers
  },
  ref
) => (
  <Tippy
    animation={animation}
    appendTo={appendTo}
    content={content}
    className={className}
    placement={placement}
    arrow={arrow}
    delay={delay}
    disabled={disabled}
    popperOptions={popperOptions}
    singleton={singleton}
    trigger={trigger}
    onTrigger={onTrigger}
    onUntrigger={onUntrigger}
    interactive={interactive}
    onShow={onShow}
    onHide={onHide}
    ref={ref as Ref<Element>}
  >
    {children}
  </Tippy>
)

const Tooltip = forwardRef(TooltipRenderFunction)

export default Tooltip
