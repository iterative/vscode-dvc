import { EventEmitter } from 'vscode'
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
  emitters
}: {
  options: ExecutionOptions
  emitters?: {
    completedEventEmitter?: EventEmitter<void>
    stdOutEventEmitter?: EventEmitter<string>
    startedEventEmitter?: EventEmitter<void>
  }
}): Promise<ChildProcess> => {
  const { command, cwd, env } = getExecutionDetails(options)

  const [executable, ...args] = command.split(' ')

  const childProcess = spawn(executable, args, {
    cwd,
    env
  })

  emitters?.startedEventEmitter?.fire()

  childProcess.stdout.on('data', chunk => {
    const output = getOutput(chunk)
    emitters?.stdOutEventEmitter?.fire(output)
  })

  childProcess.stderr.on('data', chunk => {
    const output = getOutput(chunk)
    Logger.error(output)
  })

  childProcess.on('close', () => {
    emitters?.completedEventEmitter?.fire()
  })

  return childProcess
}
