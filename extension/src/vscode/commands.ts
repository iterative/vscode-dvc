import { commands } from 'vscode'

export const registerPathCommand = (
  name: string,
  func: (cwd: string) => Promise<string>
) =>
  commands.registerCommand(name, path => {
    return func(path)
  })

export const registerUriCommand = (
  name: string,
  uriName: 'rootUri' | 'resourceUri',
  func: (fsPath: string) => Promise<string>
) => commands.registerCommand(name, context => func(context[uriName].fsPath))
