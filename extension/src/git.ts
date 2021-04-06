import { execPromise } from './util'
import { extname, resolve } from 'path'

const getUntrackedDirectories = async (
  repositoryRoot: string
): Promise<string[]> => {
  const { stdout } = await execPromise(
    'git ls-files --others --exclude-standard --directory --no-empty-directory',
    {
      cwd: repositoryRoot
    }
  )
  return stdout
    .trim()
    .split('\n')
    .filter(path => path && extname(path) === '')
    .map(path => resolve(repositoryRoot, path))
}

const getUntrackedFiles = async (repositoryRoot: string): Promise<string[]> => {
  const { stdout } = await execPromise(
    'git ls-files --others --exclude-standard',
    {
      cwd: repositoryRoot
    }
  )
  return stdout
    .trim()
    .split('\n')
    .filter(path => path)
    .map(path => resolve(repositoryRoot, path))
}

export const getAllUntracked = async (
  repositoryRoot: string
): Promise<string[]> => {
  const [files, dirs] = await Promise.all([
    getUntrackedFiles(repositoryRoot),

    getUntrackedDirectories(repositoryRoot)
  ])
  return [...files, ...dirs]
}
