import { distPath, react, experiments, plots, setup } from 'dvc-vscode-webview'
import { EventName, IEventNamePropertyMapping } from '../telemetry/constants'
import { ContextKey } from '../vscode/context'

export enum ViewKey {
  EXPERIMENTS = 'dvc-experiments',
  PLOTS = 'dvc-plots',
  SETUP = 'dvc-setup'
}

type Name = keyof IEventNamePropertyMapping
export type EventNames = {
  createdEvent: Name
  closedEvent: Name
  focusChangedEvent: Name
}

export const WebviewDetails: {
  [key in ViewKey]: {
    contextKey: ContextKey
    distPath: string
    eventNames: EventNames
    scripts: readonly string[]
    title: string
    viewKey: ViewKey
  }
} = {
  [ViewKey.EXPERIMENTS]: {
    contextKey: ContextKey.EXPERIMENTS_WEBVIEW_ACTIVE,
    distPath,
    eventNames: {
      closedEvent: EventName.VIEWS_EXPERIMENTS_TABLE_CLOSED,
      createdEvent: EventName.VIEWS_EXPERIMENTS_TABLE_CREATED,
      focusChangedEvent: EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED
    },
    scripts: [react, experiments],
    title: 'Experiments',
    viewKey: ViewKey.EXPERIMENTS
  },
  [ViewKey.PLOTS]: {
    contextKey: ContextKey.PLOTS_WEBVIEW_ACTIVE,
    distPath,
    eventNames: {
      closedEvent: EventName.VIEWS_PLOTS_CLOSED,
      createdEvent: EventName.VIEWS_PLOTS_CREATED,
      focusChangedEvent: EventName.VIEWS_PLOTS_FOCUS_CHANGED
    },
    scripts: [react, plots],
    title: 'Plots',
    viewKey: ViewKey.PLOTS
  },
  [ViewKey.SETUP]: {
    contextKey: ContextKey.SETUP_WEBVIEW_ACTIVE,
    distPath,
    eventNames: {
      closedEvent: EventName.VIEWS_SETUP_CLOSE,
      createdEvent: EventName.VIEWS_SETUP_CREATED,
      focusChangedEvent: EventName.VIEWS_SETUP_FOCUS_CHANGED
    },
    scripts: [react, setup],
    title: 'Setup',
    viewKey: ViewKey.SETUP
  }
} as const
