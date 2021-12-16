import { basePlotsUrl } from '../../../util'
import { getWebviewMessageFixture } from '..'
import { Uri, ViewColumn, window } from 'vscode'
import { ViewKey } from '../../../../webview/constants'

const webviewPanel = window.createWebviewPanel(
  ViewKey.PLOTS,
  'webview for asWebviewUri',
  ViewColumn.Active,
  {
    enableScripts: true
  }
)

const baseUrl = webviewPanel.webview
  .asWebviewUri(Uri.file(basePlotsUrl))
  .toString()

webviewPanel.dispose()

const uriJoin = (...segments: string[]) => segments.join('/')

const data = getWebviewMessageFixture(baseUrl, uriJoin)

export default data
