import { ViewColumn } from 'vscode'
import { RegisteredCommands } from '../commands/external'

export const APPLICATION_INSIGHTS_KEY = '46e8e554-d50a-471a-a53b-4af2b1cd6594'
export const EXTENSION_ID = 'iterative.dvc'

const ViewOpenedEvent = {
  VIEWS_EXPERIMENTS_FILTER_BY_TREE_OPENED:
    'views.experimentsFilterByTree.opened',
  VIEWS_EXPERIMENTS_PARAMS_AND_METRICS_TREE_OPENED:
    'views.experimentsParamsAndMetricsTree.opened',
  VIEWS_EXPERIMENTS_SORT_BY_TREE_OPENED: 'views.experimentsSortByTree.opened',
  VIEWS_EXPERIMENTS_TREE_OPENED: 'views.experimentsTree.opened',
  VIEWS_TRACKED_EXPLORER_TREE_OPENED: 'views.trackedExplorerTree.opened'
} as const

export type ViewOpenedEventName =
  typeof ViewOpenedEvent[keyof typeof ViewOpenedEvent]

export const EventName = Object.assign(
  {
    EXTENSION_LOAD: 'extension.load',
    VIEWS_EXPERIMENTS_TABLE_CLOSED: 'views.experimentsTable.closed',
    VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED: 'views.experimentsTable.focusChanged'
  } as const,
  ViewOpenedEvent,
  RegisteredCommands
)

type DvcRootCount = { dvcRootCount: number }

export interface IEventNamePropertyMapping {
  [EventName.EXTENSION_LOAD]: {
    cliAccessible: boolean
    workspaceFolderCount: number
    dvcRootCount: number
  }

  [EventName.EXPERIMENT_APPLY]: undefined
  [EventName.EXPERIMENT_BRANCH]: undefined
  [EventName.EXPERIMENT_FILTER_ADD]: undefined
  [EventName.EXPERIMENT_FILTER_REMOVE]: undefined
  [EventName.EXPERIMENT_FILTERS_REMOVE]: undefined
  [EventName.EXPERIMENT_FILTERS_REMOVE_ALL]: undefined
  [EventName.EXPERIMENT_GARBAGE_COLLECT]: undefined
  [EventName.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE]: undefined
  [EventName.EXPERIMENT_REMOVE]: undefined
  [EventName.EXPERIMENT_RUN]: undefined
  [EventName.EXPERIMENT_RUN_QUEUED]: undefined
  [EventName.EXPERIMENT_RUN_RESET]: undefined
  [EventName.EXPERIMENT_SHOW]: undefined
  [EventName.EXPERIMENT_SORT_ADD]: undefined
  [EventName.EXPERIMENT_SORT_REMOVE]: undefined
  [EventName.EXPERIMENT_SORTS_REMOVE]: undefined
  [EventName.EXPERIMENT_SORTS_REMOVE_ALL]: undefined
  [EventName.QUEUE_EXPERIMENT]: undefined
  [EventName.STOP_EXPERIMENT]: { stopped: boolean; wasRunning: boolean }

  [EventName.ADD_TARGET]: undefined
  [EventName.CHECKOUT_TARGET]: undefined
  [EventName.CHECKOUT]: undefined
  [EventName.COMMIT_TARGET]: undefined
  [EventName.COMMIT]: undefined
  [EventName.DELETE_TARGET]: undefined
  [EventName.INIT]: undefined
  [EventName.PULL_TARGET]: undefined
  [EventName.PULL]: undefined
  [EventName.PUSH_TARGET]: undefined
  [EventName.PUSH]: undefined
  [EventName.REMOVE_TARGET]: undefined

  [EventName.TRACKED_EXPLORER_OPEN_FILE]: undefined
  [EventName.TRACKED_EXPLORER_COPY_FILE_PATH]: undefined
  [EventName.TRACKED_EXPLORER_COPY_REL_FILE_PATH]: undefined

  [EventName.EXTENSION_DESELECT_DEFAULT_PROJECT]: undefined
  [EventName.EXTENSION_SELECT_DEFAULT_PROJECT]: undefined
  [EventName.EXTENSION_SETUP_WORKSPACE]: { completed: boolean }

  [EventName.VIEWS_EXPERIMENTS_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_FILTER_BY_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_PARAMS_AND_METRICS_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_SORT_BY_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_TRACKED_EXPLORER_TREE_OPENED]: DvcRootCount

  [EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED]: {
    active: boolean
    viewColumn: ViewColumn | undefined
    visible: boolean
  }
  [EventName.VIEWS_EXPERIMENTS_TABLE_CLOSED]: undefined
}
