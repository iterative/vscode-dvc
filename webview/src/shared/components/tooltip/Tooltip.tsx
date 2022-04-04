import React, { forwardRef, Ref } from 'react'
import cn from 'classnames'
import Tippy, { TippyProps } from '@tippyjs/react/headless'
import styles from './styles.module.scss'
import 'tippy.js/dist/tippy.css'

export const HEADER_TOOLTIP_DELAY = 100
export const CELL_TOOLTIP_DELAY = 1000

export const TooltipBox: React.FC = ({ children, ...attrs }) => (
  <div role="tooltip" className={cn('tippy-box', styles.menu)} {...attrs}>
    {children}
  </div>
)

export const TooltipArrow: React.FC = () => (
  <div className="tippy-arrow" data-popper-arrow="" />
)

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
    plugins,
    render,
    animation = false,
    arrow = false
  },
  ref
) => (
  <Tippy
    animation={animation}
    content={content}
    render={render}
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
    plugins={plugins}
    ref={ref as Ref<Element>}
  >
    {children}
  </Tippy>
)

const Tooltip = forwardRef(TooltipRenderFunction)

export default Tooltip
