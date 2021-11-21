import React from 'react'
import styles from './styles.module.scss'

export const HoverMenu: React.FC = ({ children }) => (
  <div className={styles.menu}>{children}</div>
)
