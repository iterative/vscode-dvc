import { InternalVsCodeApi } from '../src/shared/api'
import { action } from '@storybook/addon-actions'
import { viewports } from '../src/stories/util'
import './styles.scss'

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
  },
  themes: {
    default: 'dark',
    list: [
      { name: 'dark', class: 'vscode-dark', color: '#222' },
      { name: 'light', class: 'vscode-light', color: '#EEE' },
      { name: 'divebar', class: 'vscode-divebar', color: '#E2E' }
    ]
  }
}
