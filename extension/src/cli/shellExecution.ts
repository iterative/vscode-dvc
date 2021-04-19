import { EventEmitter } from 'vscode'
import { Commands } from './commands'
import { ChildProcess, spawn } from 'child_process'
import { Logger } from '../common/Logger'
import { ExecutionOptions, getExecutionDetails } from './executionDetails'

const getOutput = (data: string | Buffer): string =>
  data
    .toString()
    .split(/(\r?\n)/g)
    .join('\r')

export const executeInShell = async ({
  options,
  command,
  emitters
}: {
  options: ExecutionOptions
  command: Commands
  emitters?: {
    completedEventEmitter?: EventEmitter<void>
    stdOutEventEmitter?: EventEmitter<string>
    startedEventEmitter?: EventEmitter<void>
  }
}): Promise<ChildProcess> => {
  const { env, command: execCommand } = getExecutionDetails(options, command)

  const childProcess = spawn(execCommand, {
    cwd: options.cwd,
    env,
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
