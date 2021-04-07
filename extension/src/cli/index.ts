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
): Promise<Record<string, string>> => {
  const { stdout } = await execCommand(options, Commands.status)
  const fullStatus = JSON.parse(stdout)

  const excludeAlwaysChanged = (key: string): boolean =>
    !fullStatus[key].includes('always changed')

  const getChanges = (
    status: Record<string, Record<string, string>>[]
  ): Record<string, string>[] =>
    status
      .map(entry => entry?.['changed outs'] || entry?.['changed deps'])
      .filter(value => value)

  const statusReducer = (
    changed: Record<string, string>,
    key: string
  ): Record<string, string> => {
    const status = getChanges(fullStatus[key])
    return Object.assign(changed, ...status)
  }

  const changed = Object.keys(fullStatus)
    .filter(excludeAlwaysChanged)
    .reduce(statusReducer, {})

  return changed
}
