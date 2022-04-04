import { MessageFromWebview } from 'dvc/src/webview/contract'

export interface InternalVsCodeApi {
  setState<T>(state: T): void
  postMessage(message: MessageFromWebview): void
}

declare global {
  function acquireVsCodeApi(): InternalVsCodeApi
}

export const vsCodeApi = acquireVsCodeApi()
