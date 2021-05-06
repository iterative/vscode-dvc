import { commands } from 'vscode'

export const setContextValue = (key: string, value: unknown) =>
  commands.executeCommand('setContext', key, value)
