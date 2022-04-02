import React, { forwardRef, Ref } from 'react'
import Tippy, { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import 'tippy.js/dist/tippy.css'

export const HEADER_TOOLTIP_DELAY = 100
export const CELL_TOOLTIP_DELAY = 1000

const TooltipRenderFunction: React.ForwardRefRenderFunction<
  unknown,
  TippyProps
> = (
  {
    children,
    content,
    delay,
    disabled,
    singleton,
    trigger,
    interactive,
    onShow,
    onHide,
    placement,
    popperOptions,
    onTrigger,
    onClickOutside,
    onUntrigger,
    followCursor,
    plugins,
    animation = false,
    className = styles.menu,
    arrow = false
  },
  ref
) => (
  <Tippy
    animation={animation}
    content={content}
    className={className}
    placement={placement}
    arrow={arrow}
    delay={delay}
    disabled={disabled}
    popperOptions={popperOptions}
    singleton={singleton}
    trigger={trigger}
    interactive={interactive}
    onTrigger={onTrigger}
    onUntrigger={onUntrigger}
    onClickOutside={onClickOutside}
    onShow={onShow}
    onHide={onHide}
    followCursor={followCursor}
    plugins={plugins}
    ref={ref as Ref<Element>}
  >
    {children}
  </Tippy>
)

const Tooltip = forwardRef(TooltipRenderFunction)

export default Tooltip
