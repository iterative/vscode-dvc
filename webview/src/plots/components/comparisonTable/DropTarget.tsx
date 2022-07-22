import React from 'react'
import styles from './styles.module.scss'

export const DropTarget: React.FC = () => (
  <div className={styles.dropTarget} data-testid="comparison-drop-target"></div>
)
