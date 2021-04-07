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
  const changed = Object.keys(fullStatus)
    .filter(key => !fullStatus[key].includes('always changed'))
    .reduce((obj: Record<string, string>, key: string): Record<
      string,
      string
    > => {
      const status = fullStatus[key]
        .map(
          (entry: Record<string, Record<string, string>>) =>
            entry?.['changed outs'] || entry?.['changed deps']
        )
        .filter((value: Record<string, string> | undefined) => value)
      return Object.assign(obj, ...status)
    }, {})

  return changed
}
