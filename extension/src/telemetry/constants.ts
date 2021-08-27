import { RegisteredCommands } from '../externalCommands'

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
  [EventName.EXPERIMENT_FILTERS_REMOVE]: undefined
  [EventName.EXPERIMENT_GARBAGE_COLLECT]: undefined
  [EventName.EXPERIMENT_REMOVE]: undefined
  [EventName.EXPERIMENT_SORT_ADD]: undefined
  [EventName.EXPERIMENT_SORTS_REMOVE]: undefined
  [EventName.EXTENSION_LOAD]: { workspaceFolderCount: number }
  [EventName.QUEUE_EXPERIMENT]: undefined
}
