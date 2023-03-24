import React, { ReactElement } from 'react'
import styles from './styles.module.scss'
import { Error } from '../icons'
import Tooltip from '../tooltip/Tooltip'

export const ErrorTooltip: React.FC<{
  error?: string
  children: ReactElement
}> = ({ children, error }) => (
  <Tooltip
    content={
      <div className={styles.errorTooltip}>
        <Error className={styles.errorIcon} />
        {error}
      </div>
    }
    placement="bottom"
    disabled={!error}
  >
    {children}
  </Tooltip>
)
