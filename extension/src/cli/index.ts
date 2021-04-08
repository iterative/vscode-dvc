import { basename, dirname, join } from 'path'
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
): Promise<Record<string, string[]>> => {
  const { stdout } = await execCommand(options, Commands.status)
  const status = JSON.parse(stdout)

  const excludeAlwaysChanged = (key: string): boolean =>
    !status[key].includes('always changed')

  const getChanged = (
    status: Record<string, Record<string, string>>[]
  ): Record<string, string>[] =>
    status
      .map(entry => entry?.['changed outs'] || entry?.['changed deps'])
      .filter(value => value)

  const statusReducer = (
    reducedStatus: Record<string, string>,
    key: string
  ): Record<string, string> => {
    const changed = getChanged(status[key])
    return Object.assign(reducedStatus, ...changed)
  }

  const reducedStatus = Object.keys(status)
    .filter(excludeAlwaysChanged)
    .reduce(statusReducer, {})

  return Object.entries(reducedStatus).reduce(
    (statusObj, [relativePath, status]) => {
      statusObj[status] = statusObj[status] || []
      statusObj[status].push(join(options.cwd, relativePath))
      return statusObj
    },
    {} as Record<string, string[]>
  )
}
