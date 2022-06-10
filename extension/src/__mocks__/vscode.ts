import { join } from 'path'
import { URI, Utils } from 'vscode-uri'

export const commands = jest.fn()
export const EventEmitter = jest.fn()
export const Extension = jest.fn()
export const extensions = jest.fn()
export enum QuickPickItemKind {
  Separator = '999'
}
export const scm = jest.fn()
export const Terminal = jest.fn()
export const ThemeColor = jest.fn()
export const ThemeIcon = jest.fn()
export const TreeItem = jest.fn()
export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2
}
export const Uri = {
  file: URI.file,
  from: URI.from,
  joinPath: Utils.joinPath
}
export const window = {
  createOutputChannel: jest.fn(),
  createTreeView: jest.fn(),
  registerFileDecorationProvider: jest.fn(),
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showInputBox: jest.fn(),
  showOpenDialog: jest.fn(),
  showQuickPick: jest.fn()
}
export const workspace = {
  createFileSystemWatcher: jest.fn(),
  workspaceFolders: [
    {
      uri: {
        fsPath: join(__dirname, '..', '..')
      }
    }
  ]
}
export const WorkspaceEdit = jest.fn()
