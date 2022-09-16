import React, { ReactNode, ReactElement } from 'react'
import { TippyProps } from '@tippyjs/react'
import styles from './styles.module.scss'
import Tooltip, {
  CELL_TOOLTIP_DELAY
} from '../../../shared/components/tooltip/Tooltip'

export type CellHintTooltipProps = {
  tooltipContent: ReactNode
  children: ReactElement
}

export const CellHintTooltip: React.FC<CellHintTooltipProps & TippyProps> = ({
  tooltipContent,
  children,
  delay = [CELL_TOOLTIP_DELAY, 0]
}) => {
  return (
    <Tooltip
      content={<span className={styles.cellHintTooltip}>{tooltipContent}</span>}
      placement="bottom-start"
      offset={[0, -2]}
      delay={delay}
    >
      {children}
    </Tooltip>
  )
}
