/* global window */

import { Disposable } from '@hediet/std/disposable'
import { addMessageHandler } from './window'

interface InternalVsCodeApi {
  getState<T>(): T
  setState<T>(state: T): void
  postMessage<T>(message: T): void
}

declare function acquireVsCodeApi(): InternalVsCodeApi

export interface VsCodeApi<TState, TMessageFromWebview, TMessageToWebview> {
  getState(): TState | undefined
  setState(state: TState): void
  postMessage(message: TMessageFromWebview): void
  addMessageHandler(handler: (message: TMessageToWebview) => void): Disposable
}

export function getVsCodeApi<
  TState,
  TMessageFromWebview,
  TMessageToWebview
>(): VsCodeApi<TState, TMessageFromWebview, TMessageToWebview> {
  // acquireVsCodeApi can be called only once.
  // This hack makes hot reload possible.
  const w = window as { vscodeApi?: InternalVsCodeApi }
  if (!w.vscodeApi) {
    w.vscodeApi = acquireVsCodeApi()
  }
  const api = w.vscodeApi

  return {
    getState: () => api.getState(),
    setState: state => api.setState(state),
    postMessage: api.postMessage,
    addMessageHandler
  }
}
