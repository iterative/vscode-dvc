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
    default: 'Default Dark',
    list: [
      { name: 'Default Dark', class: 'vscode-dark', color: '#222' },
      { name: 'Default Light', class: 'vscode-light', color: '#EEE' },
      { name: 'Red', class: 'vscode-red', color: '#F22' },
      { name: 'Dive Bar', class: 'vscode-divebar', color: '#E2E' },
      { name: 'One Dark Pro', class: 'vscode-onedarkpro', color: '#333' },
      {
        name: 'High Contrast Light',
        class: 'vscode-high-contrast-light',
        color: '#FFF'
      },
      {
        name: 'High Contrast Dark',
        class: 'vscode-high-contrast-dark',
        color: '#000'
      }
    ]
  }
}
