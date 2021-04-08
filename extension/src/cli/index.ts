import { basename, dirname, join } from 'path'
import { Commands, getAddCommand } from './commands'
import { execCommand } from './reader'

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

export const getStatus = async (options: {
  dvcRoot: string
  cliPath: string | undefined
}): Promise<Record<string, string[]>> => {
  const { dvcRoot, cliPath } = options

  const { stdout } = await execCommand(
    { cliPath, cwd: dvcRoot },
    Commands.status
  )
  const statusOutput = JSON.parse(stdout)

  const excludeAlwaysChanged = (stageOrFile: string): boolean =>
    !statusOutput[stageOrFile].includes('always changed')

  const getStatuses = (
    status: Record<string, Record<string, string>>[]
  ): Record<string, string>[] =>
    status
      .map(entry => entry?.['changed outs'] || entry?.['changed deps'])
      .filter(value => value)

  const reduceStatuses = (
    reducedStatus: Record<string, string[]>,
    statuses: Record<string, string>[]
  ) =>
    statuses.map(entry =>
      Object.entries(entry).map(([relativePath, status]) => {
        const absolutePath = join(dvcRoot, relativePath)

        const existingPaths = reducedStatus[status] || []
        const uniquePaths = [...new Set([...existingPaths, absolutePath])]
        reducedStatus[status] = uniquePaths
      })
    )

  const statusReducer = (
    reducedStatus: Record<string, string[]>,
    stageOrFile: string
  ): Record<string, string[]> => {
    const statuses = getStatuses(statusOutput[stageOrFile])

    reduceStatuses(reducedStatus, statuses)

    return reducedStatus
  }

  return Object.keys(statusOutput)
    .filter(excludeAlwaysChanged)
    .reduce(statusReducer, {})
}
