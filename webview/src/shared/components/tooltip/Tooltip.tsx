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
    visible,
    onClickOutside,
    hideOnClick,
    onTrigger,
    appendTo,
    animation = false,
    className = typeof content === 'string' ? styles.padded : undefined,
    arrow = false
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
    interactive={interactive}
    visible={visible}
    onClickOutside={onClickOutside}
    hideOnClick={hideOnClick}
    onTrigger={onTrigger}
    onShow={onShow}
    onHide={onHide}
    ref={ref as Ref<Element>}
  >
    {children}
  </Tippy>
)

const Tooltip = forwardRef(TooltipRenderFunction)

export default Tooltip
