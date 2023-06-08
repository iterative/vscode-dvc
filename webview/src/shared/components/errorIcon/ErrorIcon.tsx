import React from 'react'
import styles from './styles.module.scss'
import { ErrorTooltip } from '../tooltip/ErrorTooltip'
import { Error } from '../icons'

export const ErrorIcon: React.FC<{ error: string; size: number }> = ({
  error: msg,
  size
}) => (
  <ErrorTooltip error={msg}>
    <div>
      <Error
        className={styles.errorIcon}
        data-testid="error-icon"
        height={size}
        width={size}
      />
    </div>
  </ErrorTooltip>
)
