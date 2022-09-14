import React, { ReactNode, ReactElement } from 'react'
import styles from './styles.module.scss'
import Tooltip, {
  CELL_TOOLTIP_DELAY
} from '../../../shared/components/tooltip/Tooltip'

export const CellHintTooltip: React.FC<{
  tooltipContent: ReactNode
  children: ReactElement
}> = ({ tooltipContent, children }) => {
  return (
    <Tooltip
      content={<span className={styles.cellHintTooltip}>{tooltipContent}</span>}
      placement="bottom-start"
      offset={[0, -2]}
      delay={[CELL_TOOLTIP_DELAY, 0]}
    >
      {children}
    </Tooltip>
  )
}
