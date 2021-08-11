import { IExtension } from './interfaces'

export const setup = async (extension: IExtension) => {
  const hasWorkspaceFolder = extension.hasWorkspaceFolder()
  if (!hasWorkspaceFolder) {
    return
  }

  await extension.initializePreCheck()

  if (extension.hasRoots() && (await extension.canRunCli())) {
    return extension.initialize()
  }

  extension.reset()
}
