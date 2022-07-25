import { join } from 'path'
import { executeProcess } from './processExecution'

export const DOT_GIT = '.git'
export const DOT_GIT_HEAD = join(DOT_GIT, 'HEAD')
export const DOT_GIT_INDEX = join(DOT_GIT, 'index')
export const GIT_REFS = join(DOT_GIT, 'refs')
export const GIT_LOGS_REFS = join(DOT_GIT, 'logs', 'refs')
export const HEADS_GIT_REFS = join(GIT_REFS, 'heads')

export const getHasChanges = async (
  repositoryRoot: string
): Promise<boolean> => {
  const output = await executeProcess({
    args: ['diff', '--name-only', '-z'],
    cwd: repositoryRoot,
    executable: 'git'
  })
  return !!output
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

export const getGitRepositoryRoot = (cwd: string): Promise<string> =>
  executeProcess({
    args: ['rev-parse', '--show-toplevel'],
    cwd,
    executable: 'git'
  })

export const gitStageAll = async (cwd: string) => {
  const repositoryRoot = await getGitRepositoryRoot(cwd)

  return executeProcess({
    args: ['add', '.'],
    cwd: repositoryRoot,
    executable: 'git'
  })
}
