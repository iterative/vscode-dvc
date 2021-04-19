import { EventEmitter } from 'vscode'
import { Config } from '../Config'
import { Commands } from './commands'
import { ChildProcess, spawn } from 'child_process'
import { Logger } from '../common/Logger'
import { getExecutionDetails } from './executionDetails'

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
  const { env: execEnv, command: execCommand } = getExecutionDetails(
    config,
    command
  )

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
