import Tippy, { TippyProps } from '@tippyjs/react'
import React, { useRef } from 'react'
import { useIsFullyContained } from './useIsFullyContained'
import sharedStyles from '../../styles.module.scss'

export const OverflowHoverTooltip: React.FC<
  Pick<TippyProps, 'content' | 'children'>
> = ({ children, content }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isDisabled = useIsFullyContained(wrapperRef)
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
