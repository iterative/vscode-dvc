import { join } from 'path'

export const Extension = jest.fn()
export const extensions = jest.fn()
export const Terminal = jest.fn()
export const window = jest.fn()
export const Uri = jest.fn()
export const workspace = {
  workspaceFolders: [
    {
      uri: {
        fsPath: join(__dirname, '..', '..')
      }
    }
  ]
}
