import { Extension, extensions } from 'vscode'

export const getExtension = <T>(name: string): Thenable<T> | undefined => {
  const extension = extensions.getExtension(name)
  if (!extension) {
    return
  }
  return (extension as Extension<T>).activate()
}
