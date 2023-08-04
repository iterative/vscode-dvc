import React from 'react'
import { ComparisonPlotImg } from 'dvc/src/plots/webview/contract'
import { RefreshButton } from '../../../../shared/components/button/RefreshButton'
import { refreshRevisions } from '../../../util/messages'
import { ErrorIcon } from '../../../../shared/components/errorIcon/ErrorIcon'
import styles from '../styles.module.scss'

export const ComparisonTableMissingCell: React.FC<{
  plot: ComparisonPlotImg
}> = ({ plot }) => (
  <div className={styles.noImageContent}>
    {plot.errors?.length ? (
      <>
        <div className={styles.errorIcon}>
          <ErrorIcon error={plot.errors.join('\n')} size={48} />
        </div>
        <RefreshButton onClick={refreshRevisions} />
      </>
    ) : (
      <p className={styles.emptyIcon}>-</p>
    )}
  </div>
)
