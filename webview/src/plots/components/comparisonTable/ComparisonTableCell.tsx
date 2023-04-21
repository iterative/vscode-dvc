import React from 'react'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { RefreshButton } from '../../../shared/components/button/RefreshButton'
import { refreshRevisions, zoomPlot } from '../messages'
import { ErrorIcon } from '../ErrorIcon'

type ComparisonTableCellProps = {
  path: string
  plot: ComparisonPlot
}

const MissingPlotTableCell: React.FC<{ plot: ComparisonPlot }> = ({ plot }) => (
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

export const ComparisonTableCell: React.FC<ComparisonTableCellProps> = ({
  path,
  plot
}) => {
  const loading = plot.loading
  const missing = !loading && !plot.url

  if (loading) {
    return (
      <div className={styles.noImageContent}>
        <p>Loading...</p>
      </div>
    )
  }

  if (missing) {
    return <MissingPlotTableCell plot={plot} />
  }

  return (
    <button
      className={styles.imageWrapper}
      onClick={() => zoomPlot(plot.url)}
      data-testid="image-plot-button"
    >
      <img
        draggable={false}
        src={plot.url}
        alt={`Plot of ${path} (${plot.id})`}
      />
    </button>
  )
}
