import { Uri, ViewColumn, WebviewPanel, window } from 'vscode'
import { distPath, main } from 'dvc-vscode-webview'
import { BaseWebview } from '.'
import { ViewKey, WebviewData, GenericWebviewState } from './contract'
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

const isExperimentsWebviewState = (
  state: GenericWebviewState<unknown>
): state is GenericWebviewState<TableData> => {
  const tableData = state.webviewData as TableData
  return !tableData || !!(tableData.rows && tableData.columns)
}

const isPlotsWebviewState = (
  state: GenericWebviewState<unknown>
): state is GenericWebviewState<PlotsData> => {
  const tableData = state.webviewData as PlotsData
  return !tableData || !!tableData.metrics
}

const isValidState = (
  viewKey: ViewKey,
  state: GenericWebviewState<unknown>
): state is GenericWebviewState<WebviewData> =>
  (viewKey === ViewKey.EXPERIMENTS && isExperimentsWebviewState(state)) ||
  (viewKey === ViewKey.PLOTS && isPlotsWebviewState(state))

const create = async (
  viewKey: ViewKey,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: GenericWebviewState<unknown>
) => {
  const isValid = isValidState(viewKey, state)
  if (!isValid) {
    throw new Error(`trying to set invalid state into ${viewKey}`)
  }

  const { contextKey, eventNames } = WebviewDetails[viewKey]

  const view = BaseWebview.create(
    webviewPanel,
    internalCommands,
    state,
    eventNames,
    contextKey,
    [main]
  )
  await view.isReady()
  return view
}

export const createWebview = (
  viewKey: ViewKey,
  internalCommands: InternalCommands,
  state: GenericWebviewState<unknown>,
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

  return create(viewKey, webviewPanel, internalCommands, state)
}

export const restoreWebview = <T extends TableData | PlotsData>(
  viewKey: ViewKey,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: GenericWebviewState<unknown>
): Promise<BaseWebview<T>> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(create(viewKey, webviewPanel, internalCommands, state))
    } catch (e: unknown) {
      reject(e)
    }
  })
}
