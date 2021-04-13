import { join } from 'path'
import { URI, Utils } from 'vscode-uri'

export const EventEmitter = jest.fn()
export const Extension = jest.fn()
export const extensions = jest.fn()
export const Terminal = jest.fn()
export const window = {
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn()
}
export const workspace = {
  workspaceFolders: [
    {
      uri: {
        fsPath: join(__dirname, '..', '..')
      }
    }
  ]
}
export const Uri = {
  file: URI.file,
  joinPath: Utils.joinPath
}
