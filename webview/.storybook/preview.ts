import { InternalVsCodeApi } from '../src/shared/api'

declare global {
  interface Window {
    webviewData: Record<string, string>
    acquireVsCodeApi: () => InternalVsCodeApi
  }
}

window.webviewData = {}
window.acquireVsCodeApi = () =>
  ({
    getState: () => {},
    postMessage: () => {},
    setState: () => {}
  } as InternalVsCodeApi)

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' }
}
