import { EventEmitter } from 'events'

export enum MessengerEvents {
  columnReordered = 'column-reordered'
}

export const messenger = new EventEmitter()
