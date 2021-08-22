import { Extension, extensions } from 'vscode'

export const getExtension = <T>(name: string): Extension<T> =>
  extensions.getExtension(name) as Extension<T>
