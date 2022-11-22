import { basename, extname, join, relative, resolve } from 'path'
import {
  ensureFileSync,
  existsSync,
  lstatSync,
  readdir,
  readFileSync,
  removeSync,
  writeFileSync
} from 'fs-extra'
import { load } from 'js-yaml'
import { Uri } from 'vscode'
import { standardizePath } from './path'
import { definedAndNonEmpty } from '../util/array'
import { Logger } from '../common/logger'
import { gitPath } from '../cli/git/constants'

export const exists = (path: string): boolean => existsSync(path)

export const isDirectory = (path: string): boolean => {
  try {
    return lstatSync(path).isDirectory()
  } catch {
    return false
  }
}

export const getModifiedTime = (path: string): number =>
  lstatSync(path).mtime.getTime()

export const findDvcSubRootPaths = async (
  cwd: string
): Promise<string[] | undefined> => {
  if (isDirectory(join(cwd, '.dvc'))) {
    return [cwd]
  }
  const children = await readdir(cwd)

  return children
    .filter(child => isDirectory(join(cwd, child, '.dvc')))
    .map(child => standardizePath(join(cwd, child)))
}

export const findDvcRootPaths = async (cwd: string): Promise<string[]> => {
  const subRoots = await findDvcSubRootPaths(cwd)

  if (definedAndNonEmpty(subRoots)) {
    return subRoots
  }
  return []
}

export const findAbsoluteDvcRootPath = async (
  cwd: string,
  relativePathPromise: Promise<string | undefined>
): Promise<string[]> => {
  const relativePath = await relativePathPromise
  if (!relativePath) {
    return []
  }

  const absoluteRoot = standardizePath(resolve(cwd, relativePath))

  return [absoluteRoot]
}

// .git inside a submodule is a file with the following content: `gitdir: ../.git/modules/demo`
const findDotGitDir = (gitRoot: string) => {
  const dotGitPath = join(gitRoot, gitPath.DOT_GIT)

  const isSubmodule = lstatSync(dotGitPath).isFile()
  if (isSubmodule) {
    const dotGitAsFileContent = readFileSync(dotGitPath, 'utf8')
    const gitDirPrefix = 'gitdir: '
    const gitDirLine = dotGitAsFileContent
      .split(/\r?\n/)
      .find(line => line.indexOf(gitDirPrefix) === 0)
    return resolve(gitRoot, ...(gitDirLine?.slice(8).split('/') || []))
  }
  return dotGitPath
}

const gitRootGitDir: { [key: string]: string } = {}

export const getGitPath = (gitRoot: string, path: string) => {
  const gitDir = gitRootGitDir[gitRoot] || findDotGitDir(gitRoot)
  gitRootGitDir[gitRoot] = gitDir

  if (path === gitPath.DOT_GIT) {
    return gitDir
  }

  return join(gitDir, path)
}

export const isSameOrChild = (root: string, path: string) => {
  const rel = relative(root, path)
  return !rel.startsWith('..')
}

export type Out =
  | string
  | Record<string, { checkpoint?: boolean; cache?: boolean }>

export type PartialDvcYaml = {
  stages: {
    [stage: string]: {
      outs?: Out[]
    }
  }
}

export const isAnyDvcYaml = (path?: string): boolean =>
  !!(
    path &&
    (extname(path) === '.dvc' ||
      basename(path) === 'dvc.lock' ||
      basename(path) === 'dvc.yaml')
  )

export const relativeWithUri = (dvcRoot: string, uri: Uri) =>
  relative(dvcRoot, uri.fsPath)

export const removeDir = (path: string): void => removeSync(path)

export const loadYaml = <T>(path: string): T | undefined => {
  try {
    return load(readFileSync(path, 'utf8')) as T
  } catch {
    Logger.error(`failed to load yaml ${path}`)
  }
}

export const loadJson = <T>(path: string): T | undefined => {
  try {
    return JSON.parse(readFileSync(path).toString()) as T
  } catch {
    Logger.error(`failed to load JSON from ${path}`)
  }
}

export const writeJson = <T extends Record<string, unknown>>(
  path: string,
  obj: T
): void => {
  ensureFileSync(path)
  return writeFileSync(path, JSON.stringify(obj))
}
