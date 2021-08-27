import { workspace } from 'vscode'

export const getConfigValue = (key: string): string =>
  workspace.getConfiguration().get(key, '')

const sanitize = (value: unknown): unknown => {
  if (value === undefined || value === '') {
    return null
  }
  return value
}

export const setConfigValue = (key: string, value: unknown) => {
  const sanitizedValue = sanitize(value)
  return workspace.getConfiguration().update(key, sanitizedValue)
}
