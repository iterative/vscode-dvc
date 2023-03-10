import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'

export const zoomPlot = () =>
  sendMessage({ type: MessageFromWebviewType.ZOOM_PLOT })
