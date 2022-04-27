import { join } from 'path'
import { v4 } from 'uuid'
import { exists, loadJson, writeJson } from '../fileSystem'

type UserConfig = {
  user_id: string
}

const readOrCreateConfig = (): UserConfig | undefined => {
  const { userConfigDir } = require('appdirs') as {
    userConfigDir: (appName: string, appAuthor: string) => string
  }

  const configPath = userConfigDir('telemetry', 'iterative')
  if (exists(configPath)) {
    return loadJson<UserConfig>(configPath)
  }

  const legacyConfigPath = userConfigDir(join('dvc', 'user_id'), 'iterative')
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
