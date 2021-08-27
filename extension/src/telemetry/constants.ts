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
  [EventName.EXTENSION_LOAD]: { workspaceFolderCount: number }
  [EventName.EXPERIMENT_APPLY]: undefined
  [EventName.EXPERIMENT_REMOVE]: undefined
  [EventName.EXPERIMENT_BRANCH]: undefined
  [EventName.QUEUE_EXPERIMENT]: undefined
}
