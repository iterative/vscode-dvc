import { commands, Extension, extensions } from 'vscode'

type ExtensionDetails = {
  id: string
  name: string
  version: string
}

type PackageJSON = {
  packageJSON: ExtensionDetails
}

const getExtension = <T>(id: string): Extension<T & PackageJSON> | undefined =>
  extensions.getExtension<T & PackageJSON>(id)

export const getExtensionAPI = async <T>(
  name: string
): Promise<T | undefined> => {
  const extension = getExtension<T>(name)
  if (!extension) {
    return
  }

  try {
    return await extension.activate()
  } catch {}
}

export const getExtensionVersion = <T>(id: string): string | undefined => {
  const extension = getExtension<T>(id)

  if (!extension) {
    return
  }

  return (extension.packageJSON as { version: string }).version
}

export const isInstalled = (id: string): boolean =>
  !!extensions.all.some(extension => extension.id === id)

export const showExtension = (id: string) =>
  commands.executeCommand('workbench.extensions.search', `@id:${id}`)

export const getOnDidChangeExtensions = () => extensions.onDidChange
