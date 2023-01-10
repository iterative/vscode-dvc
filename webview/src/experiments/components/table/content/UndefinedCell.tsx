import React from 'react'
import styles from '../styles.module.scss'
import { CellContents } from './CellContent'

export const UndefinedCell: React.FC = () => (
  <div className={styles.innerCell}>
    <CellContents>-</CellContents>
  </div>
)
