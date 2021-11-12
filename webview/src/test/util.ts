import { WebviewColorTheme } from 'dvc/src/webview/contract'

export interface CustomWindow extends Window {
  webviewData: {
    theme: WebviewColorTheme
  }
}
