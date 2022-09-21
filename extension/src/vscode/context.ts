import { commands } from 'vscode'

export const setContextValue = (key: string, value: unknown) =>
  commands.executeCommand('setContext', key, value)

export type Context = string | Record<string, unknown> | undefined

export const getDvcRootFromContext = (context: Context): string | undefined => {
  const isDvcRoot = typeof context === 'string'
  return isDvcRoot ? context : undefined
}
