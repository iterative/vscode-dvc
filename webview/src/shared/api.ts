export interface InternalVsCodeApi {
  setState<T>(state: T): void
  postMessage<T>(message: T): void
}

declare global {
  function acquireVsCodeApi(): InternalVsCodeApi
}

export const vsCodeApi = acquireVsCodeApi()
