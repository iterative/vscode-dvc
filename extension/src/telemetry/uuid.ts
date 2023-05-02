import { join } from 'path'
import isEmpty from 'lodash.isempty'
import { v4 } from 'uuid'
import { exists, loadJson, writeJson } from '../fileSystem'
import { getDVCAppDir, getIterativeAppDir } from '../util/appdirs'

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
  const dvcAppDir = getDVCAppDir()
  const iterativeAppDir = getIterativeAppDir()

  const legacyDirectory = join(dvcAppDir, 'user_id')

  const legacyConfigPath = legacyDirectory
  const legacyConfig = loadConfig(legacyConfigPath)

  const configPath = join(iterativeAppDir, 'telemetry')
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
