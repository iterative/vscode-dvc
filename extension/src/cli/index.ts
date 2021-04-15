import { basename, dirname } from 'path'
import { Commands, getCommandWithTarget } from './commands'
import { execCommand } from './reader'

const runTargetCommand = async (
  options: {
    fsPath: string
    cliPath: string | undefined
  },
  command: Commands
): Promise<string> => {
  const { fsPath, cliPath } = options

  const cwd = dirname(fsPath)

  const target = basename(fsPath)
  const commandWithTarget = getCommandWithTarget(command, target)

  return execCommand({ cwd, cliPath }, commandWithTarget)
}

export const addTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.ADD)

export const pushTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.PUSH)

export const pullTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.PULL)
