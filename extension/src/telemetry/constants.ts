import { RegisteredCommands } from '../commands/external'

export const APPLICATION_INSIGHTS_KEY = '46e8e554-d50a-471a-a53b-4af2b1cd6594'
export const EXTENSION_ID = 'iterative.dvc'

export const EventName = Object.assign(
  {
    EXTENSION_LOAD: 'EXTENSION.LOAD'
  } as const,
  RegisteredCommands
)

export interface IEventNamePropertyMapping {
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
  [EventName.EXTENSION_LOAD]: { workspaceFolderCount: number }
  [EventName.QUEUE_EXPERIMENT]: undefined
  [EventName.STOP_EXPERIMENT]: { stopped: boolean; wasRunning: boolean }

  [EventName.ADD_TARGET]: undefined
  [EventName.CHECKOUT_TARGET]: undefined
  [EventName.CHECKOUT]: undefined
  [EventName.COMMIT_TARGET]: undefined
  [EventName.COMMIT]: undefined
  [EventName.PULL]: undefined
  [EventName.PUSH]: undefined

  [EventName.EXTENSION_DESELECT_DEFAULT_PROJECT]: undefined
  [EventName.EXTENSION_SELECT_DEFAULT_PROJECT]: undefined
  [EventName.EXTENSION_SETUP_WORKSPACE]: { completed: boolean }
}
