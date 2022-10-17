import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../../shared/vscode'

export const focusFiltersTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_FILTERS_TREE })

export const focusSortsTree = () =>
  sendMessage({ type: MessageFromWebviewType.FOCUS_SORTS_TREE })

export const openPlotsWebview = () =>
  sendMessage({ type: MessageFromWebviewType.OPEN_PLOTS_WEBVIEW })

export const addStarredFilter = () =>
  sendMessage({
    type: MessageFromWebviewType.ADD_STARRED_EXPERIMENT_FILTER
  })
