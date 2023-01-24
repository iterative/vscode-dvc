import React from 'react'
import styles from '../styles.module.scss'

interface CellContentProps {
  children: string
}

export const CellContents: React.FC<CellContentProps> = ({ children }) => (
  <span className={styles.cellContents}>{children}</span>
)
