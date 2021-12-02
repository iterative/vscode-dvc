import { basePlotsUrl } from '../../../util'
import { getData, getMinimalData } from '..'
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

export const minimalStaticPlotsFixture = getMinimalData(baseUrl)
export const staticPlotsFixture = getData(baseUrl)
