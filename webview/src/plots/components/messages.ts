import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'

export const zoomPlot = (imagePath?: string) =>
  sendMessage({ payload: imagePath, type: MessageFromWebviewType.ZOOM_PLOT })

export const removeRevision = (revision: string) => {
  sendMessage({
    payload: revision,
    type: MessageFromWebviewType.TOGGLE_EXPERIMENT
  })
}

export const refreshRevisions = () =>
  sendMessage({
    type: MessageFromWebviewType.REFRESH_REVISIONS
  })

export const selectRevisions = () => {
  sendMessage({
    type: MessageFromWebviewType.SELECT_EXPERIMENTS
  })
}
