import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { RefreshButton } from '../../../shared/components/button/RefreshButton'
import { sendMessage } from '../../../shared/vscode'
import { zoomPlot } from '../messages'
import { Error } from '../../../shared/components/icons'
import { ErrorTooltip } from '../../../shared/components/errorTooltip/ErrorTooltip'

type ComparisonTableCellProps = {
  path: string
  plot?: ComparisonPlot & { fetched: boolean }
}

const MissingPlotTableCell: React.FC<{ plot: ComparisonPlot }> = ({ plot }) => (
  <div className={styles.noImageContent}>
    {plot.error ? (
      <>
        <ErrorTooltip error={plot.error}>
          <div>
            <Error height={48} width={48} className={styles.errorIcon} />
          </div>
        </ErrorTooltip>
        <RefreshButton
          onClick={() =>
            sendMessage({
              payload: plot.revision,
              type: MessageFromWebviewType.REFRESH_REVISION
            })
          }
        />
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
  const fetched = plot?.fetched
  const loading = !fetched && !plot?.url
  const missing = fetched && !plot?.url

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
        alt={`Plot of ${path} (${plot.revision})`}
      />
    </button>
  )
}
