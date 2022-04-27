import { v4 } from 'uuid'
import { writeFileSync, readFileSync } from 'fs-extra'
import { exists } from '../fileSystem'

const readOrCreateConfig = () => {
  const { userConfigDir } = require('appdirs') as {
    userConfigDir: (appName: string, appAuthor: string) => string
  }

  const legacyConfigPath = userConfigDir('dvc/user_id', 'iterative')
  const configPath = userConfigDir('telemetry', 'iterative')
  if (exists(configPath)) {
    return JSON.parse(readFileSync(configPath).toString())
  }

  if (exists(legacyConfigPath)) {
    const oldConfig = readFileSync(legacyConfigPath)
    writeFileSync(configPath, oldConfig)
    return JSON.parse(oldConfig.toString())
  }

  const newConfig = { user_id: v4() }
  writeFileSync(configPath, JSON.stringify(newConfig))
  return newConfig
}

const readOrCreateUserId = () => {
  const { user_id } = readOrCreateConfig()
  return user_id
}

let user_id: string
export const getUserId = (): string => {
  if (!user_id) {
    user_id = readOrCreateUserId()
  }
  return user_id
}
