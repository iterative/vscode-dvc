import { workspace } from 'vscode'

export const getConfigValue = (key: string): string =>
  workspace.getConfiguration().get(key, '')

export const setConfigValue = (key: string, value: unknown) =>
  workspace.getConfiguration().update(key, value || null)
