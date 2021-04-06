import { Uri } from 'vscode'
import { extname, resolve } from 'path'
import { execPromise, trimAndSplit } from './util'

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
  return getUris(
    repositoryRoot,
    trimAndSplit(stdout).filter(path => extname(path) === '')
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
  return [...files, ...dirs]
}
