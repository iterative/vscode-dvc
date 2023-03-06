import React, { ReactNode } from 'react'
import styles from './styles.module.scss'

export const IconsWrapper: React.FC<{ children: ReactNode }> = ({
  children
}) => <div className={styles.iconsWrapper}>{children}</div>
