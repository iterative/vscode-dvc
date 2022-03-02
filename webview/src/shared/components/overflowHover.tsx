import Tippy, { TippyProps } from '@tippyjs/react'
import React, { useRef } from 'react'
import sharedStyles from '../../shared/styles.module.scss'

export const OverflowHoverTooltip: React.FC<
  Pick<TippyProps, 'content' | 'children'>
> = ({ children, content }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { scrollWidth, clientWidth } = wrapperRef.current || {}
  const isDisabled = React.useMemo(
    () =>
      !(
        wrapperRef.current && (clientWidth as number) < (scrollWidth as number)
      ),
    [scrollWidth, clientWidth]
  )
  return (
    <Tippy
      animation={false}
      content={content}
      placement="bottom-start"
      className={sharedStyles.menu}
      disabled={isDisabled}
      delay={100}
      ref={wrapperRef}
    >
      {children}
    </Tippy>
  )
}
