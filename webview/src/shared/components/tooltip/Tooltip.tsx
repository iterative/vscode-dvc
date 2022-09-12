import React, { forwardRef, Ref } from 'react'
import { followCursor } from 'tippy.js'
import Tippy, { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import 'tippy.js/dist/tippy.css'

export const HEADER_TOOLTIP_DELAY = 100
export const CELL_TOOLTIP_DELAY = 1000

const TooltipRenderFunction: React.ForwardRefRenderFunction<
  unknown,
  TippyProps & { isContextMenu?: boolean }
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
    isContextMenu = false,
    animation = false,
    followCursor: followCursorVal,
    offset
  },
  ref
) => (
  <Tippy
    arrow={false}
    animation={animation}
    appendTo={appendTo}
    content={
      isContextMenu ? (
        content
      ) : (
        <div className={styles.tooltipContent}>{content}</div>
      )
    }
    placement={placement}
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
    followCursor={followCursorVal}
    plugins={[followCursor]}
    offset={offset}
  >
    {children}
  </Tippy>
)

const Tooltip = forwardRef(TooltipRenderFunction)

export default Tooltip
