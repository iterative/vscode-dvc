import { relative } from 'path'
import { Uri } from 'vscode'
import { tryThenMaybeForce } from '../../cli/actions'
import { showGenericError } from '../../vscode/modal'

export type ResourceCommand = ({
  dvcRoot,
  resourceUri
}: {
  dvcRoot: string
  resourceUri: Uri
}) => Promise<string | undefined>

export const getResourceCommand = (
  func: (cwd: string, target: string) => Promise<string>,
  forceFunc: (cwd: string, target: string) => Promise<string>
): ResourceCommand => ({ dvcRoot, resourceUri }) => {
  const relPath = relative(dvcRoot, resourceUri.fsPath)

  return tryThenMaybeForce(func, forceFunc, dvcRoot, relPath)
}

export const getSimpleResourceCommand = (
  func: (cwd: string, target: string) => Promise<string>
): ResourceCommand => async ({ dvcRoot, resourceUri }) => {
  const relPath = relative(dvcRoot, resourceUri.fsPath)
  try {
    return await func(dvcRoot, relPath)
  } catch {
    return showGenericError()
  }
}

export type RootCommand = ({
  rootUri
}: {
  rootUri: Uri
}) => Promise<string | undefined>

export const getRootCommand = (
  func: (fsPath: string) => Promise<string>,
  forceFunc: (fsPath: string) => Promise<string>
): RootCommand => ({ rootUri }) => {
  const cwd = rootUri.fsPath

  return tryThenMaybeForce(func, forceFunc, cwd)
}
