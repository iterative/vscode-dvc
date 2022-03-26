import { InternalVsCodeApi } from '../src/shared/api'
import { action } from '@storybook/addon-actions'
import { viewports } from '../src/stories/util'

declare global {
  interface Window {
    webviewData: Record<string, string>
    acquireVsCodeApi: () => InternalVsCodeApi
  }
}

window.webviewData = { theme: 'dark' }
window.acquireVsCodeApi = () =>
  ({
    postMessage: action('postMessage'),
    setState: action('setState')
  } as unknown as InternalVsCodeApi)

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  viewport: {
    viewports,
    defaultViewport: 'default'
  }
}
