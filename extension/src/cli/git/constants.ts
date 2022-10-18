import { join } from 'path'
import fs from 'fs'

export enum gitPath {
  DOT_GIT = '.git',
  DOT_GIT_HEAD = 'HEAD',
  DOT_GIT_INDEX = 'index',
  GIT_REFS = 'refs',
  GIT_LOGS_REFS = 'logs/ref',
  HEADS_GIT_REFS = 'heads'
}

// .git inside a submodule is a file with the following content: `gitdir: ../.git/modules/demo`
const getGitDirPath = (gitRoot: string) => {
  const dotGitPath = join(gitRoot, gitPath.DOT_GIT)

  if (fs.lstatSync(dotGitPath).isFile()) {
    const dotGitAsFileContent = fs.readFileSync(dotGitPath, 'utf8')
    const gitDirPrefix = 'gitdir: '
    const gitDirLine = dotGitAsFileContent
      .split(/\r?\n/)
      .find(line => line.indexOf(gitDirPrefix) === 0)
    return join(gitRoot, ...(gitDirLine?.slice(8).split('/') || []))
  }
  return dotGitPath
}

const gitRootGitDir: { [key: string]: string } = {}

export const getGitPath = (gitRoot: string, path: gitPath | string) => {
  const gitDir = gitRootGitDir[gitRoot] || getGitDirPath(gitRoot)
  gitRootGitDir[gitRoot] = gitDir

  if (path === gitPath.DOT_GIT) {
    return gitDir
  }

  return join(gitDir, ...path.split('/'))
}

export enum Command {
  ADD = 'add',
  CLEAN = 'clean',
  COMMIT = 'commit',
  DIFF = 'diff',
  LS_FILES = 'ls-files',
  PUSH = 'push',
  RESET = 'reset',
  REV_PARSE = 'rev-parse'
}

export enum Flag {
  DIRECTORIES = '-d',
  DIRECTORY = '--directory',
  DOT = '.',
  EXCLUDE_STANDARD = '--exclude-standard',
  FORCE = '-f',
  HARD = '--hard',
  MESSAGE = '-m',
  NAME_ONLY = '--name-only',
  NO_EMPTY_DIRECTORY = '--no-empty-directory',
  OTHERS = '--others',
  QUIET = '-q',
  RAW_WITH_NUL = '-z',
  SET_UPSTREAM = '--set-upstream',
  SHOW_TOPLEVEL = '--show-toplevel'
}

export enum Commit {
  HEAD = 'HEAD'
}

export const DEFAULT_REMOTE = 'origin'

export type Args = (Command | Flag | Commit | typeof DEFAULT_REMOTE)[]
