import { MessageFromWebviewType } from 'dvc/src/webview/contract'
import { sendMessage } from '../../shared/vscode'

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

export const addConfiguration = () =>
  sendMessage({ type: MessageFromWebviewType.ADD_CONFIGURATION })

export const pushExperiment = (id: string) =>
  sendMessage({ payload: [id], type: MessageFromWebviewType.PUSH_EXPERIMENT })

export const reorderColumns = (newOrder: string[]) =>
  sendMessage({
    payload: newOrder,
    type: MessageFromWebviewType.REORDER_COLUMNS
  })

export const resetCommits = (branch: string) =>
  sendMessage({
    payload: branch,
    type: MessageFromWebviewType.RESET_COMMITS
  })

export const resizeColumn = (id: string, width: number) =>
  sendMessage({
    payload: { id, width },
    type: MessageFromWebviewType.RESIZE_COLUMN
  })

export const selectColumns = () =>
  sendMessage({ type: MessageFromWebviewType.SELECT_COLUMNS })

export const showMoreCommits = (branch: string) =>
  sendMessage({
    payload: branch,
    type: MessageFromWebviewType.SHOW_MORE_COMMITS
  })

export const showLessCommits = (branch: string) =>
  sendMessage({
    payload: branch,
    type: MessageFromWebviewType.SHOW_LESS_COMMITS
  })

export const selectBranches = () =>
  sendMessage({
    type: MessageFromWebviewType.SELECT_BRANCHES
  })

export const toggleExperiment = (id: string) =>
  sendMessage({
    payload: id,
    type: MessageFromWebviewType.TOGGLE_EXPERIMENT
  })

export const toggleShowOnlyChanged = () =>
  sendMessage({
    type: MessageFromWebviewType.TOGGLE_SHOW_ONLY_CHANGED
  })

export const toggleStarred = (id: string) =>
  sendMessage({
    payload: [id],
    type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
  })

export const redirectToSetup = () =>
  sendMessage({ type: MessageFromWebviewType.REDIRECT_TO_SETUP })

export const refreshData = () =>
  sendMessage({ type: MessageFromWebviewType.REFRESH_EXP_DATA })
