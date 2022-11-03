import { Uri } from 'vscode'

export const standardizePath = (path: string): string => Uri.file(path).fsPath

export const standardizePossiblePath = (path?: string): string | undefined => {
  if (!path) {
    return
  }
  return standardizePath(path)
}
