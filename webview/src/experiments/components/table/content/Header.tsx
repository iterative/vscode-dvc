import React from 'react'
import { HeaderContext } from '@tanstack/react-table'
import styles from '../styles.module.scss'
import { OverflowHoverTooltip } from '../../overflowHoverTooltip/OverflowHoverTooltip'
import { Column } from 'dvc/src/experiments/webview/contract'

interface HeaderProps {
  name: string
}

export const Header: React.FC<HeaderProps> = ({ name }) => {
  return (
    <OverflowHoverTooltip content={name}>
      <div className={styles.headerCellWrapper}>
        <span>{name}</span>
      </div>
    </OverflowHoverTooltip>
  )
}
