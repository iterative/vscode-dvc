import { TippyProps } from '@tippyjs/react'
import React, { useRef } from 'react'
import styles from './styles.module.scss'
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
      content={<div className={styles.overflowTooltip}>{content}</div>}
      placement="bottom-start"
      disabled={isDisabled}
      delay={HEADER_TOOLTIP_DELAY}
      ref={wrapperRef}
    >
      {children}
    </Tooltip>
  )
}
