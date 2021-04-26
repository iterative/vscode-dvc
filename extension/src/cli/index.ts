import { ensureDir } from 'fs-extra'
import { basename, dirname } from 'path'
import { buildCommand, Commands } from './commands'
import { execProcess } from './execution'

const runTargetCommand = async (
  options: {
    fsPath: string
    cliPath: string | undefined
    pythonBinPath: string | undefined
  },
  command: Commands
): Promise<string> => {
  const { fsPath, cliPath, pythonBinPath } = options

  const cwd = dirname(fsPath)

  const target = basename(fsPath)
  const commandWithTarget = buildCommand(command, target)
  await ensureDir(cwd)

  return execProcess({ cwd, cliPath, pythonBinPath }, commandWithTarget)
}

export const addTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
  pythonBinPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.ADD)

export const checkoutTarget = (options: {
  fsPath: string
  cliPath: string | undefined
  pythonBinPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.CHECKOUT)

export const pushTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
  pythonBinPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.PUSH)

export const pullTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
  pythonBinPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.PULL)
