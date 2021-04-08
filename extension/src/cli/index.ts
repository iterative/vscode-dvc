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

type StatusOutput = Record<string, (ValidStageOrFileStatuses | string)[]>

type FilteredStatusOutput = Record<string, ValidStageOrFileStatuses[]>

type ValidStageOrFileStatuses = Record<string, PathStatus>

type PathStatus = Record<string, Status>

const filterExcludedStagesOrFiles = (
  statusOutput: StatusOutput
): FilteredStatusOutput => {
  const excludeAlwaysChanged = (stageOrFile: string): boolean =>
    !statusOutput[stageOrFile].includes('always changed')

  return Object.keys(statusOutput)
    .filter(excludeAlwaysChanged)
    .reduce((filteredStatusOutput, stageOrFile: string) => {
      filteredStatusOutput[stageOrFile] = statusOutput[
        stageOrFile
      ] as ValidStageOrFileStatuses[]
      return filteredStatusOutput
    }, {} as FilteredStatusOutput)
}

const getFileOrStageStatuses = (
  fileOrStage: ValidStageOrFileStatuses[]
): PathStatus[] =>
  fileOrStage
    .map(entry => entry?.['changed outs'] || entry?.['changed deps'])
    .filter(value => value)

const reduceStatuses = (
  reducedStatus: Partial<Record<Status, string[]>>,
  statuses: PathStatus[]
) =>
  statuses.map(entry =>
    Object.entries(entry).map(([relativePath, status]) => {
      const existingPaths = reducedStatus[status] || []
      reducedStatus[status] = [...new Set([...existingPaths, relativePath])]
    })
  )

const reduceToPathStatuses = (
  filteredStatusOutput: FilteredStatusOutput
): Partial<Record<Status, string[]>> => {
  const statusReducer = (
    reducedStatus: Partial<Record<Status, string[]>>,
    entry: ValidStageOrFileStatuses[]
  ): Partial<Record<Status, string[]>> => {
    const statuses = getFileOrStageStatuses(entry)

    reduceStatuses(reducedStatus, statuses)

    return reducedStatus
  }

  return Object.values(filteredStatusOutput).reduce(statusReducer, {})
}

const getUriStatuses = (
  pathStatuses: Partial<Record<Status, string[]>>,
  dvcRoot: string
): Partial<Record<Status, Uri[]>> => {
  return Object.entries(pathStatuses).reduce((uriStatuses, [status, paths]) => {
    uriStatuses[status as Status] = paths?.map(path =>
      Uri.file(join(dvcRoot, path))
    )
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
    (ValidStageOrFileStatuses | string)[]
  >

  const filteredStatusOutput = filterExcludedStagesOrFiles(statusOutput)
  const pathStatuses = reduceToPathStatuses(filteredStatusOutput)

  return getUriStatuses(pathStatuses, dvcRoot)
}
