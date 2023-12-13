import React from 'react'
import styles from './styles.module.scss'
import { Error } from '../icons'

export const ErrorTooltipContent: React.FC<{ error?: string }> = ({
  error
}) => (
  <div className={styles.errorTooltip}>
    <Error className={styles.errorIcon} />
    {error}
  </div>
)
