import { resolve } from 'path'
import { execPromise } from './util'
import { trimAndSplit } from './util/stdout'
import { isDirectory } from './fileSystem'

const getUris = (repositoryRoot: string, relativePaths: string[]) =>
  relativePaths.map(path => resolve(repositoryRoot, path))

const getUntrackedDirectories = async (
  repositoryRoot: string
): Promise<string[]> => {
  const { stdout } = await execPromise(
    'git ls-files --others --exclude-standard --directory --no-empty-directory',
    {
      cwd: repositoryRoot
    }
  )
  return getUris(repositoryRoot, trimAndSplit(stdout)).filter(path =>
    isDirectory(path)
  )
}

const getUntrackedFiles = async (repositoryRoot: string): Promise<string[]> => {
  const { stdout } = await execPromise(
    'git ls-files --others --exclude-standard',
    {
      cwd: repositoryRoot
    }
  )
  return getUris(repositoryRoot, trimAndSplit(stdout))
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
