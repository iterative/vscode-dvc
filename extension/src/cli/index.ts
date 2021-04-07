import { basename, dirname } from 'path'
import { Commands, getAddCommand } from './commands'
import { execCommand, ReaderOptions } from './reader'

export const add = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => {
  const { fsPath, cliPath } = options

  const cwd = dirname(fsPath)

  const toAdd = basename(fsPath)
  const addCommand = getAddCommand(toAdd)

  const { stdout } = await execCommand({ cwd, cliPath }, addCommand)
  return stdout
}

export const getStatus = async (
  options: ReaderOptions
): Promise<Record<string, unknown>> => {
  const { stdout } = await execCommand(options, Commands.status)
  const fullStatus = JSON.parse(stdout)
  return fullStatus
}
