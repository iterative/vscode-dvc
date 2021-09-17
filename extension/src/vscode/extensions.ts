type ExtensionDetails = {
  id: string
  name: string
  version: string
}

type PackageJSON = {
  packageJSON: ExtensionDetails
}

const getExtension = <T>(id: string) => {
  const { extensions } = require('vscode') as typeof import('vscode')
  return extensions.getExtension<T & PackageJSON>(id)
}

export const getExtensionAPI = <T>(name: string): Thenable<T> | undefined => {
  const extension = getExtension<T>(name)
  if (!extension) {
    return
  }

  return extension.activate()
}

export const getExtensionVersion = <T>(id: string): string | undefined => {
  const extension = getExtension<T>(id)

  if (!extension) {
    return
  }

  return extension.packageJSON.version
}

export const isInstalled = (id: string): boolean => !!getExtension(id)
