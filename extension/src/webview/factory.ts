import { Uri, ViewColumn, WebviewPanel, window } from 'vscode'
import { distPath, main } from 'dvc-vscode-webview'
import { BaseWebview } from '.'
import {
  WebviewState,
  UnknownWebviewState,
  ViewKey,
  WebviewData
} from './contract'
import { InternalCommands } from '../commands/internal'
import { Resource } from '../resourceLocator'
import { TableData } from '../experiments/webview/contract'
import { PlotsData } from '../plots/webview/contract'
import { EventName, IEventNamePropertyMapping } from '../telemetry/constants'

type Name = keyof IEventNamePropertyMapping
export type EventNames = {
  createdEvent: Name
  closedEvent: Name
  focusChangedEvent: Name
}

const WebviewDetails: {
  [key in ViewKey]: {
    contextKey: string
    distPath: string
    eventNames: EventNames
    title: string
    viewKey: ViewKey
  }
} = {
  'dvc-experiments': {
    contextKey: 'dvc.experiments.webviewActive',
    distPath,
    eventNames: {
      closedEvent: EventName.VIEWS_EXPERIMENTS_TABLE_CLOSED,
      createdEvent: EventName.VIEWS_EXPERIMENTS_TABLE_CREATED,
      focusChangedEvent: EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED
    },
    title: 'Experiments',
    viewKey: ViewKey.EXPERIMENTS
  },
  'dvc-plots': {
    contextKey: 'dvc.plots.webviewActive',
    distPath,
    eventNames: {
      closedEvent: EventName.VIEWS_PLOTS_CLOSED,
      createdEvent: EventName.VIEWS_PLOTS_CREATED,
      focusChangedEvent: EventName.VIEWS_PLOTS_FOCUS_CHANGED
    },
    title: 'Plots',
    viewKey: ViewKey.PLOTS
  }
} as const

const isExperimentsWebviewState = (state: UnknownWebviewState): boolean => {
  const tableData = state.webviewData as TableData
  return !tableData || !!(tableData.rows && tableData.columns)
}

const isPlotsWebviewState = (state: UnknownWebviewState): boolean => {
  const tableData = state.webviewData as PlotsData
  return !tableData || !!tableData.metrics
}

const isValidState = (
  viewKey: ViewKey,
  state: UnknownWebviewState
): state is WebviewState<WebviewData> =>
  (viewKey === ViewKey.EXPERIMENTS && isExperimentsWebviewState(state)) ||
  (viewKey === ViewKey.PLOTS && isPlotsWebviewState(state))

const create = (
  viewKey: ViewKey,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: UnknownWebviewState
) => {
  if (!isValidState(viewKey, state)) {
    throw new Error(`trying to set invalid state into ${viewKey}`)
  }

  const { contextKey, eventNames } = WebviewDetails[viewKey]

  return new BaseWebview(
    webviewPanel,
    internalCommands,
    state,
    eventNames,
    contextKey,
    [main]
  )
}

export const createWebview = async (
  viewKey: ViewKey,
  internalCommands: InternalCommands,
  state: UnknownWebviewState,
  iconPath: Resource
) => {
  const { title, distPath } = WebviewDetails[viewKey]

  const webviewPanel = window.createWebviewPanel(
    viewKey,
    title,
    ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [Uri.file(distPath)],
      retainContextWhenHidden: true
    }
  )

  webviewPanel.iconPath = iconPath

  const view = create(viewKey, webviewPanel, internalCommands, state)
  await view.isReady()
  return view
}

export const restoreWebview = <T extends WebviewData>(
  viewKey: ViewKey,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: UnknownWebviewState
): Promise<BaseWebview<T>> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(create(viewKey, webviewPanel, internalCommands, state))
    } catch (e: unknown) {
      reject(e)
    }
  })
}
