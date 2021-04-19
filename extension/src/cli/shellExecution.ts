import { EventEmitter } from 'vscode'
import { Config } from '../Config'
import { Commands } from './commands'
import { getProcessEnv } from '../env'
import { spawn } from 'child_process'
import { Logger } from '../common/Logger'

const getPATH = (existingPath: string, pythonBinPath?: string): string =>
  [pythonBinPath, existingPath].filter(Boolean).join(':')

const getEnv = (config: Config): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, config.pythonBinPath)
  return {
    ...env,
    PATH
  }
}

interface cliExecutionDetails {
  env: NodeJS.ProcessEnv
  command: string
}

export const getCommand = (cliPath: string, command: string): string =>
  `${cliPath} ${command}`

const getExecutionDetails = (
  config: Config,
  command: Commands
): cliExecutionDetails => {
  const cliPath = config.dvcPath || 'dvc'
  const env = getEnv(config)
  return {
    env,
    command: getCommand(cliPath, command)
  }
}

const getOutput = (data: string | Buffer): string =>
  data
    .toString()
    .split(/(\r?\n)/g)
    .join('\r')

export const executeInShell = async ({
  config,
  command,
  cwd,
  emitters
}: {
  config: Config
  command: Commands
  cwd: string
  emitters?: {
    completedEventEmitter?: EventEmitter<void>
    stdOutEventEmitter?: EventEmitter<string>
    startedEventEmitter?: EventEmitter<void>
  }
}): Promise<void> => {
  const executionDetails = getExecutionDetails(config, command)

  const childProcess = spawn(`${executionDetails.command}`, {
    cwd,
    env: executionDetails.env,
    shell: true
  })
  emitters?.startedEventEmitter?.fire()

  childProcess.stdout?.on('data', chunk => {
    const output = getOutput(chunk)
    emitters?.stdOutEventEmitter?.fire(output)
  })

  childProcess.stderr?.on('data', chunk => {
    const output = getOutput(chunk)
    Logger.error(output)
  })

  childProcess.on('close', () => {
    emitters?.completedEventEmitter?.fire()
  })
}
