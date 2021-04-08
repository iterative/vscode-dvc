import { Uri } from 'vscode'
import { resolve } from 'path'
import uniqWith from 'lodash.uniqwith'
import isEqual from 'lodash.isequal'
import { execPromise, trimAndSplit } from './util'
import { isDirectory } from './fileSystem'

const getUris = (repositoryRoot: string, relativePaths: string[]) =>
  relativePaths.map(path => Uri.file(resolve(repositoryRoot, path)))

const getUntrackedDirectories = async (
  repositoryRoot: string
): Promise<Uri[]> => {
  const { stdout } = await execPromise(
    'git ls-files --others --exclude-standard --directory --no-empty-directory',
    {
      cwd: repositoryRoot
    }
  )
  return getUris(repositoryRoot, trimAndSplit(stdout)).filter(Uri =>
    isDirectory(Uri.fsPath)
  )
}

const getUntrackedFiles = async (repositoryRoot: string): Promise<Uri[]> => {
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
): Promise<Uri[]> => {
  const [files, dirs] = await Promise.all([
    getUntrackedFiles(repositoryRoot),
    getUntrackedDirectories(repositoryRoot)
  ])
  return uniqWith([...files, ...dirs], isEqual)
}
