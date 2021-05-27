import { EventEmitter } from 'vscode'

export const getEmitter = <T>() => new EventEmitter<T>()
