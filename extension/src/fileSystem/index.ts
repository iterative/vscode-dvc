import { basename, extname, join, parse, relative, resolve, sep } from 'path'
import {
  appendFileSync,
  ensureFileSync,
  existsSync,
  lstatSync,
  readdir,
  readFileSync,
  removeSync,
  writeFileSync
} from 'fs-extra'
import { load } from 'js-yaml'
import { Uri, workspace, window, commands } from 'vscode'
import { standardizePath } from './path'
import { definedAndNonEmpty } from '../util/array'
import { Logger } from '../common/logger'
import { gitPath } from '../cli/git/constants'
import { createValidInteger } from '../util/number'
import { processExists } from '../process/execution'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { DOT_DVC } from '../cli/dvc/constants'
import { delay } from '../util/time'

export const exists = (path: string): boolean => existsSync(path)

const checkStats = (path: string, check: 'isDirectory' | 'isFile'): boolean => {
  try {
    return lstatSync(path)[check]()
  } catch {
    return false
  }
}

export const isDirectory = (path: string): boolean =>
  checkStats(path, 'isDirectory')

export const isFile = (path: string): boolean => checkStats(path, 'isFile')

export const getModifiedTime = (path: string): number => {
  if (exists(path)) {
    return lstatSync(path).mtime.getTime()
  }
  return -1
}

export const findSubRootPaths = async (
  cwd: string,
  dotDir: string
): Promise<string[] | undefined> => {
  const children = await readdir(cwd)

  return children
    .filter(child => isDirectory(join(cwd, child, dotDir)))
    .map(child => standardizePath(join(cwd, child)))
}

export const findDvcRootPaths = async (cwd: string): Promise<string[]> => {
  const dvcRoots = []

  if (isDirectory(join(cwd, DOT_DVC))) {
    dvcRoots.push(standardizePath(cwd))
  }

  const subRoots = await findSubRootPaths(cwd, DOT_DVC)

  if (definedAndNonEmpty(subRoots)) {
    dvcRoots.push(...subRoots)
  }
  return dvcRoots.sort()
}

export const findAbsoluteDvcRootPath = async (
  cwd: string,
  relativePathPromise: Promise<string | undefined>
): Promise<string | undefined> => {
  const relativePath = await relativePathPromise
  if (!relativePath) {
    return
  }

  return standardizePath(resolve(cwd, relativePath))
}

// .git inside a submodule is a file with the following content: `gitdir: ../.git/modules/demo`
const findDotGitDir = (gitRoot: string) => {
  const dotGitPath = join(gitRoot, gitPath.DOT_GIT)

  const isSubmodule = isFile(dotGitPath)
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
    (extname(path) === DOT_DVC ||
      basename(path) === 'dvc.lock' ||
      basename(path) === 'dvc.yaml')
  )

export const openFileInEditor = async (filePath: string) => {
  const document = await workspace.openTextDocument(Uri.file(filePath))
  await window.showTextDocument(document)
  return document
}

export const openImageFileInEditor = async (imagePath: string) =>
  await commands.executeCommand('vscode.open', Uri.file(imagePath))

export const findOrCreateDvcYamlFile = (
  cwd: string,
  trainingScript: string,
  stageName: string,
  command: string
) => {
  const dvcYamlPath = `${cwd}/dvc.yaml`
  ensureFileSync(dvcYamlPath)

  const relativeScript = relative(cwd, trainingScript)

  const pipeline = `
# Read about DVC pipeline configuration (https://dvc.org/doc/user-guide/project-structure/dvcyaml-files#stages)
# to customize your stages even more
stages:
  ${stageName}:
    cmd: ${command} ${relativeScript}
    deps:
      - ${relativeScript}`

  void openFileInEditor(dvcYamlPath)
  return appendFileSync(dvcYamlPath, pipeline)
}

export const getFileExtension = (filePath: string) => parse(filePath).ext

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

export const getPidFromFile = async (
  path: string
): Promise<number | undefined> => {
  if (!exists(path)) {
    return
  }

  const contents = readFileSync(path).toString()
  const pid = createValidInteger(contents)

  if (!pid || !(await processExists(pid))) {
    removeSync(path)
    return
  }
  return pid
}

export const checkSignalFile = async (path: string): Promise<boolean> => {
  return !!(await getPidFromFile(path))
}

export const pollSignalFileForProcess = async (
  path: string,
  callback: () => void,
  ms = 5000
): Promise<void> => {
  await delay(ms)
  const signalIsValid = await checkSignalFile(path)
  if (signalIsValid) {
    return pollSignalFileForProcess(path, callback, ms)
  }
  return callback()
}

export const getBinDisplayText = (
  path: string | undefined
): string | undefined => {
  if (!path) {
    return
  }

  const workspaceRoot = getFirstWorkspaceFolder()
  if (!workspaceRoot) {
    return path
  }

  return isSameOrChild(workspaceRoot, path)
    ? '.' + sep + relative(workspaceRoot, path)
    : path
}
