import { Extension, extensions } from 'vscode'

type ExtensionDetails = {
  aiKey: string | undefined
  id: string
  version: string
}

type ThisExtensionDetails = ExtensionDetails & { aiKey: string }

type PackageJSON = {
  packageJSON: ExtensionDetails
}

const getExtension = <T>(
  name: string
): Extension<T & PackageJSON> | undefined =>
  extensions.getExtension<T & PackageJSON>(name)

export const getExtensionAPI = <T>(name: string): Thenable<T> | undefined => {
  const extension = getExtension<T>(name)
  if (!extension) {
    return
  }

  return extension.activate()
}

const getExtensionDetails = <T>(name: string): ExtensionDetails | undefined => {
  const extension = getExtension<T>(name)

  if (!extension) {
    return
  }

  return {
    aiKey: extension.packageJSON.aiKey,
    id: extension.packageJSON.id,
    version: extension.packageJSON.version
  }
}

export const getThisExtensionDetails = (): ThisExtensionDetails =>
  getExtensionDetails('iterative.dvc') as ThisExtensionDetails
