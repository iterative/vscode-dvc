import { EventEmitter } from 'vscode'
import { Config } from '../Config'
import { Commands } from './commands'
import { getProcessEnv } from '../env'
import { ChildProcess, spawn } from 'child_process'
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

export const getCommand = (config: Config, command: Commands): string => {
  const cliPath = config.dvcPath || 'dvc'
  return `${cliPath} ${command}`
}

export const getExecutionDetails = (
  config: Config,
  command: Commands
): {
  env: NodeJS.ProcessEnv
  command: string
} => {
  return {
    env: getEnv(config),
    command: getCommand(config, command)
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
}): Promise<ChildProcess> => {
  const execCommand = getCommand(config, command)
  const execEnv = getEnv(config)

  const childProcess = spawn(execCommand, {
    cwd,
    env: execEnv,
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

  return childProcess
}
