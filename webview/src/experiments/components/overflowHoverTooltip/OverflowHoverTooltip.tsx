import { TippyProps } from '@tippyjs/react'
import React, { useRef } from 'react'
import { useIsFullyContained } from './useIsFullyContained'
import Tooltip, {
  HEADER_TOOLTIP_DELAY
} from '../../../shared/components/tooltip/Tooltip'

export const OverflowHoverTooltip: React.FC<
  Pick<TippyProps, 'content' | 'children'>
> = ({ children, content }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isDisabled = useIsFullyContained(wrapperRef)
  return (
    <Tooltip
      content={content}
      placement="bottom-start"
      disabled={isDisabled}
      delay={HEADER_TOOLTIP_DELAY}
      ref={wrapperRef}
    >
      {children}
    </Tooltip>
  )
}
