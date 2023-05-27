import { ConfigurationTarget, workspace } from 'vscode'

export enum ConfigKey {
  DO_NOT_RECOMMEND_ADD_STUDIO_TOKEN = 'dvc.doNotRecommendAddStudioToken',
  DO_NOT_RECOMMEND_RED_HAT = 'dvc.doNotRecommendRedHatExtension',
  DO_NOT_SHOW_CLI_UNAVAILABLE = 'dvc.doNotShowCliUnavailable',
  DO_NOT_SHOW_SETUP_AFTER_INSTALL = 'dvc.doNotShowSetupAfterInstall',
  DVC_PATH = 'dvc.dvcPath',
  EXP_TABLE_HEAD_MAX_HEIGHT = 'dvc.experimentsTableHeadMaxHeight',
  FOCUSED_PROJECTS = 'dvc.focusedProjects',
  PYTHON_PATH = 'dvc.pythonPath',
  STUDIO_SHARE_EXPERIMENTS_LIVE = 'dvc.studio.shareExperimentsLive'
}

export const getConfigValue = <T = string, D = string>(
  key: ConfigKey,
  defaultValue?: D | T
): T =>
  workspace.getConfiguration().get(key, defaultValue ?? '') as unknown as T

export const setConfigValue = (key: ConfigKey, value: unknown) =>
  workspace.getConfiguration().update(key, value)

export const setUserConfigValue = <T>(key: ConfigKey, value: T) =>
  workspace.getConfiguration().update(key, value, ConfigurationTarget.Global)
