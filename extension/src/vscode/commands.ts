import { relative } from 'path'
import { commands } from 'vscode'

export const registerPathCommand = (
  name: string,
  func: (cwd: string) => Promise<string>
) =>
  commands.registerCommand(name, path => {
    return func(path)
  })

export const registerResourceUriCommand = (
  name: string,
  func: (cwd: string, relPath: string) => Promise<string>
) =>
  commands.registerCommand(name, ({ dvcRoot, resourceUri }) => {
    const relPath = relative(dvcRoot, resourceUri.fsPath)
    return func(dvcRoot, relPath)
  })

export const registerRootUriCommand = (
  name: string,
  func: (fsPath: string) => Promise<string>
) => commands.registerCommand(name, ({ rootUri }) => func(rootUri.fsPath))
