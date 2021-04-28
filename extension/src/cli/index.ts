import { ensureDir } from 'fs-extra'
import { basename, dirname } from 'path'
import { Args, Command } from './args'
import { runCliProcess } from './execution'

const runTargetCommand = async (
  options: {
    fsPath: string
    cliPath: string | undefined
    pythonBinPath: string | undefined
  },
  ...args: Args
): Promise<string> => {
  const { fsPath, cliPath, pythonBinPath } = options

  const cwd = dirname(fsPath)

  const target = basename(fsPath)
  await ensureDir(cwd)

  return runCliProcess({ cwd, cliPath, pythonBinPath }, ...args, target)
}

export const addTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
  pythonBinPath: string | undefined
}): Promise<string> => runTargetCommand(options, Command.ADD)
