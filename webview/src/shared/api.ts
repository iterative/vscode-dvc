import { MessageFromWebview } from 'dvc/src/webview/contract'

interface InternalVsCodeApi {
  postMessage(message: MessageFromWebview): void
}

declare global {
  function acquireVsCodeApi(): InternalVsCodeApi
}

export const vsCodeApi = acquireVsCodeApi()
