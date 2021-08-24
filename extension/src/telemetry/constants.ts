export const APPLICATION_INSIGHTS_KEY = '46e8e554-d50a-471a-a53b-4af2b1cd6594'
export const EXTENSION_ID = 'iterative.dvc'

// placeholder
export enum EventName {
  EXTENSION_LOAD = 'EXTENSION.LOAD'
}

// placeholder
export interface IEventNamePropertyMapping {
  [EventName.EXTENSION_LOAD]: {
    workspaceFolderCount: number
  }
}
