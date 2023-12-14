import React from 'react'
import { useSelector } from 'react-redux'
import styles from './table/styles.module.scss'
import { ErrorState } from './emptyState/ErrorState'
import { ExperimentsTable } from './ExperimentsTable'
import { WebviewWrapper } from '../../shared/components/webviewWrapper/WebviewWrapper'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'
import { ExperimentsState } from '../store'

const Experiments: React.FC = () => {
  const { cliError, hasData } = useSelector(
    (state: ExperimentsState) => state.tableData
  )

  if (cliError) {
    return (
      <WebviewWrapper className={styles.experiments}>
        <ErrorState cliError={cliError} />
      </WebviewWrapper>
    )
  }

  return (
    <WebviewWrapper className={styles.experiments}>
      {hasData ? (
        <ExperimentsTable />
      ) : (
        <EmptyState>Loading Experiments...</EmptyState>
      )}
    </WebviewWrapper>
  )
}

export default Experiments
