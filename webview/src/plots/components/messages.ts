import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'

export const zoomPlot = (imagePath?: string) =>
  sendMessage({ payload: imagePath, type: MessageFromWebviewType.ZOOM_PLOT })
