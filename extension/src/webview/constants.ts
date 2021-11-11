import { distPath, react, experiments, plots } from 'dvc-vscode-webview'
import { EventName, IEventNamePropertyMapping } from '../telemetry/constants'

export enum ViewKey {
  EXPERIMENTS = 'dvc-experiments',
  PLOTS = 'dvc-plots'
}

type Name = keyof IEventNamePropertyMapping
export type EventNames = {
  createdEvent: Name
  closedEvent: Name
  focusChangedEvent: Name
}

export const WebviewDetails: {
  [key in ViewKey]: {
    contextKey: string
    distPath: string
    eventNames: EventNames
    scripts: readonly string[]
    title: string
    viewKey: ViewKey
  }
} = {
  [ViewKey.EXPERIMENTS]: {
    contextKey: 'dvc.experiments.webviewActive',
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
    contextKey: 'dvc.plots.webviewActive',
    distPath,
    eventNames: {
      closedEvent: EventName.VIEWS_PLOTS_CLOSED,
      createdEvent: EventName.VIEWS_PLOTS_CREATED,
      focusChangedEvent: EventName.VIEWS_PLOTS_FOCUS_CHANGED
    },
    scripts: [react, plots],
    title: 'Plots',
    viewKey: ViewKey.PLOTS
  }
} as const
