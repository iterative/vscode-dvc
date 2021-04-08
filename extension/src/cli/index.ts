import { uniqWith } from 'lodash'
import isEqual from 'lodash.isequal'
import { basename, dirname, join } from 'path'
import { Uri } from 'vscode'
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

enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'not in cache'
}

export const getStatus = async (options: {
  dvcRoot: string
  cliPath: string | undefined
}): Promise<Partial<Record<Status, Uri[]>>> => {
  const { dvcRoot, cliPath } = options

  const { stdout } = await execCommand(
    { cliPath, cwd: dvcRoot },
    Commands.status
  )
  const statusOutput = JSON.parse(stdout)

  const excludeAlwaysChanged = (stageOrFile: string): boolean =>
    !statusOutput[stageOrFile].includes('always changed')

  const getStatuses = (
    status: Record<string, Record<string, Status>>[]
  ): Record<string, Status>[] =>
    status
      .map(entry => entry?.['changed outs'] || entry?.['changed deps'])
      .filter(value => value)

  const reduceStatuses = (
    reducedStatus: Partial<Record<Status, Uri[]>>,
    statuses: Record<string, Status>[]
  ) =>
    statuses.map(entry =>
      Object.entries(entry).map(([relativePath, status]) => {
        const absolutePath = Uri.file(join(dvcRoot, relativePath))

        const existingPaths = reducedStatus[status] || []
        const uniquePaths = uniqWith([...existingPaths, absolutePath], isEqual)
        reducedStatus[status] = uniquePaths
      })
    )

  const statusReducer = (
    reducedStatus: Partial<Record<Status, Uri[]>>,
    stageOrFile: string
  ): Partial<Record<Status, Uri[]>> => {
    const statuses = getStatuses(statusOutput[stageOrFile])

    reduceStatuses(reducedStatus, statuses)

    return reducedStatus
  }

  return Object.keys(statusOutput)
    .filter(excludeAlwaysChanged)
    .reduce(statusReducer, {})
}
