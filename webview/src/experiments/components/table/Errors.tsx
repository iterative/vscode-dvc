import React from 'react'
import styles from './styles.module.scss'
import ErrorIcon from '../../../shared/components/icons/Error'
import Tooltip from '../../../shared/components/tooltip/Tooltip'

export const ErrorTooltip: React.FC<{
  error?: string
  children: React.ReactElement
}> = ({ children, error }) => (
  <Tooltip
    content={
      <div className={styles.errorTooltip}>
        <ErrorIcon className={styles.errorIcon} />
        {error}
      </div>
    }
    placement={'bottom'}
    disabled={!error}
  >
    {children}
  </Tooltip>
)
