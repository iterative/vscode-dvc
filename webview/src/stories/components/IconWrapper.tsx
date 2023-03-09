import React, { ReactNode } from 'react'
import styles from './styles.module.scss'

export const IconWrapper: React.FC<{ children: ReactNode; name: string }> = ({
  children,
  name
}) => (
  <div className={styles.iconWrapper}>
    {children}
    <h3 className={styles.iconTitle}>{name}</h3>
  </div>
)
