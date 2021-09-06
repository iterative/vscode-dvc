import { RegisteredCommands } from '../commands/external'

export const APPLICATION_INSIGHTS_KEY = '46e8e554-d50a-471a-a53b-4af2b1cd6594'
export const EXTENSION_ID = 'iterative.dvc'

export const EventName = Object.assign(
  {
    EXTENSION_LOAD: 'extension.load'
  } as const,
  RegisteredCommands
)

type UndefinedOrError = undefined | { error: string }

export interface IEventNamePropertyMapping {
  [EventName.EXTENSION_LOAD]:
    | {
        cliAccessible: boolean
        dvcRootCount: number
        error?: string
        workspaceFolderCount: number
      }
    | { error: string }

  [EventName.EXPERIMENT_APPLY]: UndefinedOrError
  [EventName.EXPERIMENT_BRANCH]: UndefinedOrError
  [EventName.EXPERIMENT_FILTER_ADD]: UndefinedOrError
  [EventName.EXPERIMENT_FILTER_REMOVE]: UndefinedOrError
  [EventName.EXPERIMENT_FILTERS_REMOVE]: UndefinedOrError
  [EventName.EXPERIMENT_FILTERS_REMOVE_ALL]: UndefinedOrError
  [EventName.EXPERIMENT_GARBAGE_COLLECT]: UndefinedOrError
  [EventName.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE]: UndefinedOrError
  [EventName.EXPERIMENT_REMOVE]: UndefinedOrError
  [EventName.EXPERIMENT_RUN]: UndefinedOrError
  [EventName.EXPERIMENT_RUN_QUEUED]: UndefinedOrError
  [EventName.EXPERIMENT_RUN_RESET]: UndefinedOrError
  [EventName.EXPERIMENT_SHOW]: UndefinedOrError
  [EventName.EXPERIMENT_SORT_ADD]: UndefinedOrError
  [EventName.EXPERIMENT_SORT_REMOVE]: UndefinedOrError
  [EventName.EXPERIMENT_SORTS_REMOVE]: UndefinedOrError
  [EventName.EXPERIMENT_SORTS_REMOVE_ALL]: UndefinedOrError
  [EventName.QUEUE_EXPERIMENT]: UndefinedOrError
  [EventName.STOP_EXPERIMENT]:
    | { stopped: boolean; wasRunning: boolean }
    | { error: string }

  [EventName.ADD_TARGET]: UndefinedOrError
  [EventName.CHECKOUT_TARGET]: UndefinedOrError
  [EventName.CHECKOUT]: UndefinedOrError
  [EventName.COMMIT_TARGET]: UndefinedOrError
  [EventName.COMMIT]: UndefinedOrError
  [EventName.DELETE_TARGET]: UndefinedOrError
  [EventName.INIT]: UndefinedOrError
  [EventName.PULL_TARGET]: UndefinedOrError
  [EventName.PULL]: UndefinedOrError
  [EventName.PUSH_TARGET]: UndefinedOrError
  [EventName.PUSH]: UndefinedOrError
  [EventName.REMOVE_TARGET]: UndefinedOrError

  [EventName.TRACKED_EXPLORER_OPEN_FILE]: UndefinedOrError
  [EventName.TRACKED_EXPLORER_COPY_FILE_PATH]: UndefinedOrError
  [EventName.TRACKED_EXPLORER_COPY_REL_FILE_PATH]: UndefinedOrError

  [EventName.EXTENSION_DESELECT_DEFAULT_PROJECT]: UndefinedOrError
  [EventName.EXTENSION_SELECT_DEFAULT_PROJECT]: UndefinedOrError
  [EventName.EXTENSION_SETUP_WORKSPACE]:
    | { completed: boolean }
    | { error: string }
}
