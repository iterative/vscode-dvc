import React from 'react'
import styles from '../styles.module.scss'
import { OverflowHoverTooltip } from '../../overflowHoverTooltip/OverflowHoverTooltip'

interface HeaderProps {
  name: string
}

export const Header: React.FC<HeaderProps> = ({ name }) => {
  return (
    <OverflowHoverTooltip content={name}>
      <div className={styles.headerCellText}>
        <span>{name}</span>
      </div>
    </OverflowHoverTooltip>
  )
}
