import { InternalVsCodeApi } from '../src/shared/api'
import { action } from '@storybook/addon-actions'

declare global {
  interface Window {
    webviewData: Record<string, string>
    acquireVsCodeApi: () => InternalVsCodeApi
  }
}

window.webviewData = { theme: 'dark' }
window.acquireVsCodeApi = () =>
  ({
    getState: action('getState'),
    postMessage: action('postMessage'),
    setState: action('setState')
  } as unknown as InternalVsCodeApi)

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' }
}
