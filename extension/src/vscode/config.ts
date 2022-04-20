import { ConfigurationTarget, workspace } from 'vscode'

export enum ConfigKey {
  DO_NOT_RECOMMEND_RED_HAT = 'dvc.doNotRecommendRedHatExtension',
  DO_NOT_SHOW_CLI_UNAVAILABLE = 'dvc.doNotShowCliUnavailable',
  DO_NOT_SHOW_WALKTHROUGH_AFTER_INSTALL = 'dvc.doNotShowWalkthroughAfterInstall',
  DO_NOT_SHOW_UNABLE_TO_FILTER = 'dvc.doNotShowUnableToFilter',
  DVC_PATH = 'dvc.dvcPath',
  PYTHON_PATH = 'dvc.pythonPath'
}

export const getConfigValue = <T = string>(key: ConfigKey): T =>
  workspace.getConfiguration().get(key, '') as unknown as T

export const setConfigValue = (key: ConfigKey, value: unknown) =>
  workspace.getConfiguration().update(key, value)

export const setUserConfigValue = <T>(key: ConfigKey, value: T) =>
  workspace.getConfiguration().update(key, value, ConfigurationTarget.Global)
