import React, { SyntheticEvent } from 'react'
import styles from '../styles.module.scss'

interface CellTooltipProps {
  children: string
}

export const CellTooltip: React.FC<CellTooltipProps> = ({ children }) => {
  const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()
  return (
    <div
      className={styles.cellTooltip}
      role="textbox"
      tabIndex={0}
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
    >
      {children}
    </div>
  )
}
