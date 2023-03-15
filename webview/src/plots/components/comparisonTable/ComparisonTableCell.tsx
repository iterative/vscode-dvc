import React from 'react'
import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { RefreshButton } from '../../../shared/components/button/RefreshButton'
import { sendMessage } from '../../../shared/vscode'
import { zoomPlot } from '../messages'

type ComparisonTableCellProps = {
  path: string
  plot?: ComparisonPlot & { fetched: boolean }
}

export const ComparisonTableCell: React.FC<ComparisonTableCellProps> = ({
  path,
  plot
}) => {
  const missing = plot?.fetched && !plot?.url

  if (!plot?.fetched) {
    return (
      <div className={styles.noImageContent}>
        <p>Loading...</p>
      </div>
    )
  }

  if (missing) {
    return (
      <div className={styles.noImageContent}>
        <p>No Plot to Display.</p>
        <RefreshButton
          onClick={() =>
            sendMessage({
              payload: plot.revision,
              type: MessageFromWebviewType.REFRESH_REVISION
            })
          }
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => zoomPlot(plot.resourceUrl)}
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
