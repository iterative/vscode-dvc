import React, { PropsWithChildren } from 'react'
import styles from './styles.module.scss'

export const PathHighlight: React.FC<PropsWithChildren> = ({ children }) => (
  <span className={styles.pathHighlight}>{children}</span>
)
