import { ConfigurationTarget, workspace } from 'vscode'

export const getConfigValue = <T = string>(key: string): T =>
  workspace.getConfiguration().get(key, '') as unknown as T

export const setConfigValue = (key: string, value: unknown) =>
  workspace.getConfiguration().update(key, value)

export const setUserConfigValue = (key: string, value: unknown) =>
  workspace.getConfiguration().update(key, value, ConfigurationTarget.Global)
