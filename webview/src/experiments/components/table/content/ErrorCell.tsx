import cx from 'classnames'
import React from 'react'
import { CellContents } from './CellContent'
import { ErrorTooltip } from '../../../../shared/components/errorTooltip/ErrorTooltip'
import styles from '../styles.module.scss'

interface ErrorCellProps {
  error: string
}

export const ErrorCell: React.FC<ErrorCellProps> = ({ error }) => (
  <ErrorTooltip error={error}>
    <div className={cx(styles.innerCell, styles.error)}>
      <CellContents>!</CellContents>
    </div>
  </ErrorTooltip>
)
