import React, { ReactNode, ReactElement } from 'react'
import { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import Tooltip, {
  NORMAL_TOOLTIP_DELAY
} from '../../../shared/components/tooltip/Tooltip'

export type CellHintTooltipProps = {
  tooltipContent: ReactNode
  tooltipOffset?: [number, number]
  children: ReactElement
}

export const CellHintTooltip: React.FC<CellHintTooltipProps & TippyProps> = ({
  tooltipContent,
  children,
  delay = NORMAL_TOOLTIP_DELAY
}) => {
  return (
    <Tooltip
      content={<span className={styles.cellHintTooltip}>{tooltipContent}</span>}
      appendTo={document.body}
      placement="bottom-start"
      offset={[0, -2]}
      delay={delay}
      interactive={true}
    >
      {children}
    </Tooltip>
  )
}
