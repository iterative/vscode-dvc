import React from 'react'
import cx from 'classnames'
import { CommitData } from 'dvc/src/experiments/webview/contract'
import { CommitCell } from './CommitCell'
import styles from '../styles.module.scss'

type ExperimentCellProps = {
  commit?: CommitData
  description?: string
  error?: string
  label: string
  sha?: string
}

export const ExperimentCell: React.FC<ExperimentCellProps> = ({
  commit,
  description,
  error,
  label,
  sha
}) => {
  if (!description) {
    return (
      <div className={styles.experimentCellText}>
        <span>{label}</span>
      </div>
    )
  }

  return commit ? (
    <CommitCell
      commit={commit}
      description={description}
      label={label}
      sha={sha}
    />
  ) : (
    <div className={styles.experimentCellText}>
      <span
        className={cx(styles.experimentCellSecondaryName, {
          [styles.errorText]: error
        })}
      >
        {label}
      </span>
      <span className={styles.experimentCellText}>
        <span>{description}</span>
      </span>
    </div>
  )
}
