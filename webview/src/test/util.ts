import { WebviewColorTheme } from 'dvc/src/webview/contract'

export interface CustomWindow extends Window {
  webviewData: {
    theme?: WebviewColorTheme
  }
}

export const createCustomWindow = () => {
  const customWindow = {
    addEventListener: jest.fn,
    webviewData: {
      theme: WebviewColorTheme.dark
    }
  }
  Object.defineProperty(global, 'window', { value: customWindow })
}
