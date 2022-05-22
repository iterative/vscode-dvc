import { Uri } from 'vscode'

export const standardizePath = (path?: string): string | undefined => {
  if (!path) {
    return
  }
  return Uri.file(path).fsPath
}
