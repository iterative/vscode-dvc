import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'

export const addCustomPlot = () =>
  sendMessage({
    type: MessageFromWebviewType.ADD_CUSTOM_PLOT
  })

export const refreshRevisions = () =>
  sendMessage({
    type: MessageFromWebviewType.REFRESH_REVISIONS
  })

export const removeCustomPlots = () => {
  sendMessage({ type: MessageFromWebviewType.REMOVE_CUSTOM_PLOTS })
}

export const removeRevision = (revision: string) => {
  sendMessage({
    payload: revision,
    type: MessageFromWebviewType.TOGGLE_EXPERIMENT
  })
}

export const selectPlots = () =>
  sendMessage({
    type: MessageFromWebviewType.SELECT_PLOTS
  })

export const selectRevisions = () =>
  sendMessage({
    type: MessageFromWebviewType.SELECT_EXPERIMENTS
  })

export const zoomPlot = (imagePath?: string) =>
  sendMessage({ payload: imagePath, type: MessageFromWebviewType.ZOOM_PLOT })
