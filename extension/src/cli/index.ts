import { basename, dirname, join } from 'path'
import { Uri } from 'vscode'
import { getAddCommand } from './commands'
import { execCommand, status } from './reader'

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

const reduceToPathStatuses = (
  statusOutput: Record<
    string,
    (Record<string, Record<string, Status>> | string)[]
  >,
  dvcRoot: string
): Partial<Record<Status, string[]>> => {
  const excludeAlwaysChanged = (stageOrFile: string): boolean =>
    !statusOutput[stageOrFile].includes('always changed')

  const getStatuses = (
    status: Record<string, Record<string, Status>>[]
  ): Record<string, Status>[] =>
    status
      .map(entry => entry?.['changed outs'] || entry?.['changed deps'])
      .filter(value => value)

  const reduceStatuses = (
    reducedStatus: Partial<Record<Status, string[]>>,
    statuses: Record<string, Status>[]
  ) =>
    statuses.map(entry =>
      Object.entries(entry).map(([relativePath, status]) => {
        const absolutePath = join(dvcRoot, relativePath)
        const existingPaths = reducedStatus[status] || []
        reducedStatus[status] = [...new Set([...existingPaths, absolutePath])]
      })
    )

  const statusReducer = (
    reducedStatus: Partial<Record<Status, string[]>>,
    stageOrFile: string
  ): Partial<Record<Status, string[]>> => {
    const entry = statusOutput[stageOrFile] as Record<
      string,
      Record<string, Status>
    >[]
    const statuses = getStatuses(entry)

    reduceStatuses(reducedStatus, statuses)

    return reducedStatus
  }
  return Object.keys(statusOutput)
    .filter(excludeAlwaysChanged)
    .reduce(statusReducer, {})
}

const getUriStatuses = (
  pathStatuses: Partial<Record<Status, string[]>>
): Partial<Record<Status, Uri[]>> => {
  return Object.entries(pathStatuses).reduce((uriStatuses, [status, paths]) => {
    uriStatuses[status as Status] = paths?.map(path => Uri.file(path))
    return uriStatuses
  }, {} as Partial<Record<Status, Uri[]>>)
}

export const getStatus = async (options: {
  dvcRoot: string
  cliPath: string | undefined
}): Promise<Partial<Record<Status, Uri[]>>> => {
  const { dvcRoot, cliPath } = options

  const statusOutput = (await status({ cliPath, cwd: dvcRoot })) as Record<
    string,
    (Record<string, Record<string, Status>> | string)[]
  >

  const pathStatuses = reduceToPathStatuses(statusOutput, dvcRoot)

  return getUriStatuses(pathStatuses)
}
