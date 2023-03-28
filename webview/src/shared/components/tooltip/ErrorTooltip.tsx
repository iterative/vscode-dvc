import React, { ReactElement } from 'react'
import styles from './styles.module.scss'
import Tooltip from './Tooltip'
import { Error } from '../icons'

export const ErrorTooltipContent: React.FC<{ error?: string }> = ({
  error
}) => (
  <div className={styles.errorTooltip}>
    <Error className={styles.errorIcon} />
    {error}
  </div>
)

export const ErrorTooltip: React.FC<{
  error?: string
  children: ReactElement
}> = ({ children, error }) => (
  <Tooltip
    content={<ErrorTooltipContent error={error} />}
    placement="bottom"
    disabled={!error}
  >
    {children}
  </Tooltip>
)
