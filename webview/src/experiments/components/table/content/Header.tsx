import React from 'react'
import { HeaderContext } from '@tanstack/react-table'
import styles from '../styles.module.scss'
import { OverflowHoverTooltip } from '../../overflowHoverTooltip/OverflowHoverTooltip'
import { Column } from 'dvc/src/experiments/webview/contract'

interface HeaderProps {
  name: string
  context: HeaderContext<Column, unknown>
}

export const Header: React.FC<HeaderProps> = ({ name, context }) => {
  return (
    <OverflowHoverTooltip content={name}>
      <div className={styles.headerCellWrapper}>
        <span>{context.header.isPlaceholder ? '' : name}</span>
      </div>
    </OverflowHoverTooltip>
  )
}
