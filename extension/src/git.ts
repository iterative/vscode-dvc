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

export const gitReset = (cwd: string, ...args: string[]): Promise<string> =>
  executeProcess({
    args: ['reset', ...args],
    cwd,
    executable: 'git'
  })

export const gitResetWorkspace = async (cwd: string): Promise<void> => {
  await gitReset(cwd, '--hard', 'HEAD')

  await executeProcess({
    args: ['clean', '-f', '-d', '-q'],
    cwd,
    executable: 'git'
  })
}

export const gitStageAll = async (cwd: string) => {
  const repositoryRoot = await executeProcess({
    args: ['rev-parse', '--show-toplevel'],
    cwd,
    executable: 'git'
  })

  return executeProcess({
    args: ['add', '.'],
    cwd: repositoryRoot,
    executable: 'git'
  })
}
