import React, { MouseEventHandler, ReactElement } from 'react'
import { CellHintTooltip } from './CellHintTooltip'
import styles from '../styles.module.scss'
import { Indicator } from '../Indicator'

type CellRowActionProps = {
  showSubRowStates: boolean
  subRowsAffected: number
  children: ReactElement
  testId: string
  tooltipContent: string | ReactElement
  onClick?: MouseEventHandler
}

export const CellRowAction: React.FC<CellRowActionProps> = ({
  children,
  onClick,
  showSubRowStates,
  subRowsAffected,
  testId,
  tooltipContent
}) => {
  const count = (showSubRowStates && subRowsAffected) || 0

  return (
    <CellHintTooltip tooltipContent={tooltipContent}>
      <div className={styles.rowActions} data-testid={testId}>
        <Indicator onClick={onClick} count={count}>
          {children}
        </Indicator>
      </div>
    </CellHintTooltip>
  )
}
