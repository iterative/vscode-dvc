import { join } from 'path'
import isEmpty from 'lodash.isempty'
import { v4 } from 'uuid'
import { getProcessPlatform } from '../env'
import { exists, loadJson, writeJson } from '../fileSystem'

type UserConfig = {
  user_id?: string
}

const loadConfig = (configPath: string): UserConfig => {
  if (!exists(configPath)) {
    return {}
  }

  return loadJson<UserConfig>(configPath) || {}
}

const writeMissingConfigs = (
  user_id: string,
  legacyConfig: UserConfig,
  legacyConfigPath: string,
  config: UserConfig,
  configPath: string
) => {
  if (isEmpty(legacyConfig) && isEmpty(config)) {
    writeJson(legacyConfigPath, { user_id })
    writeJson(configPath, { user_id })
    return
  }

  if (isEmpty(config) || config.user_id !== user_id) {
    writeJson(configPath, { ...config, ...legacyConfig, user_id })
    return
  }

  if (isEmpty(legacyConfig)) {
    writeJson(legacyConfigPath, { ...config, user_id })
  }
}

const readOrCreateConfig = (): string | undefined => {
  const { userConfigDir } = require('appdirs') as {
    userConfigDir: (appName: string) => string
  }

  const legacyDirectory =
    getProcessPlatform() === 'win32'
      ? join('iterative', 'dvc', 'user_id')
      : join('dvc', 'user_id')

  const legacyConfigPath = userConfigDir(legacyDirectory)
  const legacyConfig = loadConfig(legacyConfigPath)

  const configPath = userConfigDir(join('iterative', 'telemetry'))
  const config = loadConfig(configPath)

  const user_id = legacyConfig.user_id || config.user_id || v4()

  if (legacyConfig.user_id !== user_id || config.user_id !== user_id) {
    writeMissingConfigs(
      user_id,
      legacyConfig,
      legacyConfigPath,
      config,
      configPath
    )
  }

  return user_id
}

export const readOrCreateUserId = () => {
  return readOrCreateConfig() || 'unknown'
}

let user_id: string
export const getUserId = (): string => {
  if (!user_id) {
    user_id = readOrCreateUserId()
  }
  return user_id
}
