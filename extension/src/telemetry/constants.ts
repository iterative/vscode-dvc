import { RegisteredCommands } from '../commands/external'

export const APPLICATION_INSIGHTS_KEY = '46e8e554-d50a-471a-a53b-4af2b1cd6594'
export const EXTENSION_ID = 'iterative.dvc'

export const EventName = Object.assign(
  {
    EXTENSION_LOAD: 'extension.load'
  } as const,
  RegisteredCommands
)

export interface IEventNamePropertyMapping {
  [EventName.EXTENSION_LOAD]: {
    cliAccessible: boolean
    workspaceFolderCount: number
    dvcRootCount: number
  }

  [EventName.EXPERIMENT_APPLY]: undefined | { error: string }
  [EventName.EXPERIMENT_BRANCH]: undefined | { error: string }
  [EventName.EXPERIMENT_FILTER_ADD]: undefined | { error: string }
  [EventName.EXPERIMENT_FILTER_REMOVE]: undefined | { error: string }
  [EventName.EXPERIMENT_FILTERS_REMOVE]: undefined | { error: string }
  [EventName.EXPERIMENT_FILTERS_REMOVE_ALL]: undefined | { error: string }
  [EventName.EXPERIMENT_GARBAGE_COLLECT]: undefined | { error: string }
  [EventName.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE]:
    | undefined
    | { error: string }
  [EventName.EXPERIMENT_REMOVE]: undefined | { error: string }
  [EventName.EXPERIMENT_RUN]: undefined | { error: string }
  [EventName.EXPERIMENT_RUN_QUEUED]: undefined | { error: string }
  [EventName.EXPERIMENT_RUN_RESET]: undefined | { error: string }
  [EventName.EXPERIMENT_SHOW]: undefined | { error: string }
  [EventName.EXPERIMENT_SORT_ADD]: undefined | { error: string }
  [EventName.EXPERIMENT_SORT_REMOVE]: undefined | { error: string }
  [EventName.EXPERIMENT_SORTS_REMOVE]: undefined | { error: string }
  [EventName.EXPERIMENT_SORTS_REMOVE_ALL]: undefined | { error: string }
  [EventName.QUEUE_EXPERIMENT]: undefined | { error: string }
  [EventName.STOP_EXPERIMENT]: { stopped: boolean; wasRunning: boolean }

  [EventName.ADD_TARGET]: undefined | { error: string }
  [EventName.CHECKOUT_TARGET]: undefined | { error: string }
  [EventName.CHECKOUT]: undefined | { error: string }
  [EventName.COMMIT_TARGET]: undefined | { error: string }
  [EventName.COMMIT]: undefined | { error: string }
  [EventName.DELETE_TARGET]: undefined | { error: string }
  [EventName.INIT]: undefined | { error: string }
  [EventName.PULL_TARGET]: undefined | { error: string }
  [EventName.PULL]: undefined | { error: string }
  [EventName.PUSH_TARGET]: undefined | { error: string }
  [EventName.PUSH]: undefined | { error: string }
  [EventName.REMOVE_TARGET]: undefined | { error: string }

  [EventName.TRACKED_EXPLORER_OPEN_FILE]: undefined | { error: string }
  [EventName.TRACKED_EXPLORER_COPY_FILE_PATH]: undefined | { error: string }
  [EventName.TRACKED_EXPLORER_COPY_REL_FILE_PATH]: undefined | { error: string }

  [EventName.EXTENSION_DESELECT_DEFAULT_PROJECT]: undefined | { error: string }
  [EventName.EXTENSION_SELECT_DEFAULT_PROJECT]: undefined | { error: string }
  [EventName.EXTENSION_SETUP_WORKSPACE]: { completed: boolean }
}
