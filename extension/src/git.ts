import { Uri } from 'vscode'
import { extname, resolve } from 'path'
import { execPromise, trimAndSplit } from './util'

const getUntrackedDirectories = async (
  repositoryRoot: string
): Promise<Uri[]> => {
  const { stdout } = await execPromise(
    'git ls-files --others --exclude-standard --directory --no-empty-directory',
    {
      cwd: repositoryRoot
    }
  )
  return trimAndSplit(stdout)
    .filter(path => extname(path) === '')
    .map(path => Uri.file(resolve(repositoryRoot, path)))
}

const getUntrackedFiles = async (repositoryRoot: string): Promise<Uri[]> => {
  const { stdout } = await execPromise(
    'git ls-files --others --exclude-standard',
    {
      cwd: repositoryRoot
    }
  )
  return trimAndSplit(stdout).map(path =>
    Uri.file(resolve(repositoryRoot, path))
  )
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
