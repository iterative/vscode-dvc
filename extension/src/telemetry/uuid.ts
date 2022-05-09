import { join } from 'path'
import { v4 } from 'uuid'
import { getProcessPlatform } from '../env'
import { exists, loadJson, writeJson } from '../fileSystem'

type UserConfig = {
  user_id: string
}

const readOrCreateConfig = (): UserConfig | undefined => {
  const { userConfigDir } = require('appdirs') as {
    userConfigDir: (appName: string) => string
  }

  const configPath = userConfigDir(join('iterative', 'telemetry'))
  if (exists(configPath)) {
    return loadJson<UserConfig>(configPath)
  }

  const legacyDirectory =
    getProcessPlatform() === 'win32'
      ? join('iterative', 'dvc', 'user_id')
      : join('dvc', 'user_id')

  const legacyConfigPath = userConfigDir(legacyDirectory)
  if (exists(legacyConfigPath)) {
    const oldConfig = loadJson<UserConfig>(legacyConfigPath)
    if (oldConfig) {
      writeJson(configPath, oldConfig)
      return oldConfig
    }
  }

  const newConfig = { user_id: v4() }
  writeJson(configPath, newConfig)
  return newConfig
}

export const readOrCreateUserId = () => {
  const config = readOrCreateConfig()
  return config?.user_id || 'unknown'
}

let user_id: string
export const getUserId = (): string => {
  if (!user_id) {
    user_id = readOrCreateUserId()
  }
  return user_id
}
