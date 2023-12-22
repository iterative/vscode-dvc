import React from 'react'
import cx from 'classnames'
import styles from './styles.module.scss'
import { Error, Info } from '../../../shared/components/icons'

export const RibbonBlockIcon: React.FC<{
  hasError: boolean
}> = ({ hasError }) =>
  hasError ? (
    <Error
      width={14}
      height={14}
      className={cx(styles.blockIcon, styles.error)}
      aria-label="Error Icon"
    />
  ) : (
    <Info
      width={14}
      height={14}
      className={styles.blockIcon}
      aria-label="Info Icon"
    />
  )
