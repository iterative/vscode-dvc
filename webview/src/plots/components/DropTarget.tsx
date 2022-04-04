import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'

export const DropTarget: React.FC = () => (
  <div className={cx(styles.plot, styles.dropTarget)} />
)
