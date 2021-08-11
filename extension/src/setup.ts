import { IExtension } from './interfaces'
import { quickPickOneWithInput, quickPickValue } from './vscode/quickPick'
import { setConfigValue } from './vscode/config'
import { pickFile } from './vscode/pickFile'

const setDvcPath = (path: string | undefined) =>
  setConfigValue('dvc.dvcPath', path)

const enterPathOrFind = (): Promise<string | undefined> =>
  quickPickOneWithInput(
    [
      {
        description: 'Browse the filesystem for a DVC executable',
        label: 'Find',
        value: 'pick'
      }
    ],
    'Enter path to a DVC CLI',
    'pick'
  )

const findPath = async () => {
  const path = await pickFile('Select a DVC executable')
  if (!path) {
    return
  }
  return setDvcPath(path)
}

const enterPathOrPickFile = async () => {
  const pickOrPath = await enterPathOrFind()

  if (pickOrPath === undefined) {
    return
  }

  if (pickOrPath !== 'pick') {
    return setDvcPath(pickOrPath)
  }

  return findPath()
}

const pickYesOrNo = (
  placeHolder: string,
  descriptionYes: string,
  descriptionNo: string
) =>
  quickPickValue(
    [
      {
        description: descriptionYes,
        label: 'Yes',
        value: true
      },
      {
        description: descriptionNo,
        label: 'No',
        value: false
      }
    ],
    { placeHolder }
  )

const pickCliPath = async () => {
  const isGlobal = await pickYesOrNo(
    'is DVC available globally?',
    "DVC can be located via the system's PATH environment variable",
    'I need to specify a path'
  )

  if (isGlobal === undefined) {
    return
  }

  if (isGlobal) {
    return setDvcPath('dvc')
  }

  return enterPathOrPickFile()
}

const pickVenvOptions = async () => {
  const dvcInVenv = await pickYesOrNo(
    'is DVC installed within the environment?',
    "all of the project's requirements are in the virtual environment",
    'this project needs access to a DVC CLI outside of the virtual environment'
  )
  if (dvcInVenv === undefined) {
    return
  }

  if (dvcInVenv) {
    return setDvcPath(undefined)
  }

  return pickCliPath()
}

export const setupWorkspace = async (): Promise<void | undefined> => {
  // insert 3rd option to select interpreter
  const usesVenv = await pickYesOrNo(
    'Does your project use a Python virtual environment?',
    'needs ms-python extension installed',
    'all of the modules required to run this project are globally available'
  )

  if (usesVenv === undefined) {
    return
  }

  if (usesVenv) {
    return pickVenvOptions()
  }

  return pickCliPath()
}

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
