import { resolve } from 'path'
import { executeProcess } from './processExecution'
import { trimAndSplit } from './util/stdout'
import { isDirectory } from './fileSystem'

const getUris = (repositoryRoot: string, relativePaths: string[]) =>
  relativePaths.map(path => resolve(repositoryRoot, path))

const getUntrackedDirectories = async (
  repositoryRoot: string
): Promise<string[]> => {
  const output = await executeProcess({
    args: [
      'ls-files',
      '--others',
      '--exclude-standard',
      '--directory',
      '--no-empty-directory'
    ],
    cwd: repositoryRoot,
    executable: 'git'
  })
  return getUris(repositoryRoot, trimAndSplit(output)).filter(path =>
    isDirectory(path)
  )
}

const getUntrackedFiles = async (repositoryRoot: string): Promise<string[]> => {
  const output = await executeProcess({
    args: ['ls-files', '--others', '--exclude-standard'],
    cwd: repositoryRoot,
    executable: 'git'
  })
  return getUris(repositoryRoot, trimAndSplit(output))
}

export const getAllUntracked = async (
  repositoryRoot: string
): Promise<Set<string>> => {
  const [files, dirs] = await Promise.all([
    getUntrackedFiles(repositoryRoot),
    getUntrackedDirectories(repositoryRoot)
  ])
  return new Set([...files, ...dirs])
}

export const gitResetWorkspace = (repositoryRoot: string): Promise<string> =>
  executeProcess({
    args: ['reset', '--hard', 'HEAD'],
    cwd: repositoryRoot,
    executable: 'git'
  })
