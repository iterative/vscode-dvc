import React from 'react'
import styles from './styles.module.scss'
import { Error } from '../../../shared/components/icons'
import Tooltip from '../../../shared/components/tooltip/Tooltip'

export const ErrorTooltip: React.FC<{
  error?: string
  children: React.ReactElement
}> = ({ children, error }) => (
  <Tooltip
    content={
      <div className={styles.errorTooltip}>
        <Error className={styles.errorIcon} />
        {error}
      </div>
    }
    placement={'bottom'}
    disabled={!error}
  >
    {children}
  </Tooltip>
)
