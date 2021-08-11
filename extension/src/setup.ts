import { IExtension } from './interfaces'
import { getInput } from './vscode/inputBox'
import { quickPickValue } from './vscode/quickPick'
import { setConfigValue } from './vscode/config'
import { pickFile } from './vscode/pickFile'

const setDvcPath = (path: string | undefined) =>
  setConfigValue('dvc.dvcPath', path)

const pickToEnterOrFind = () =>
  quickPickValue(
    [
      {
        description: 'Browse the filesystem for a DVC executable',
        label: 'Find',
        value: 'pick'
      },
      {
        label: 'Enter a value',
        value: 'enter'
      }
    ],
    { placeHolder: 'is DVC available globally?' }
  )

const enterPath = async () => {
  const value = await getInput('Enter the path to DVC')
  if (!value) {
    return
  }
  return setDvcPath(value)
}

const findPath = async () => {
  const path = await pickFile('Select a DVC executable')
  if (!path) {
    return
  }
  return setDvcPath(path)
}

const pickFileOrEnterPath = async () => {
  const pickedOption = await pickToEnterOrFind()

  if (pickedOption === undefined) {
    return
  }

  if (pickedOption === 'enter') {
    return enterPath()
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

const pickIsCliGlobal = () =>
  pickYesOrNo(
    'is DVC available globally?',
    "DVC can be located via the system's PATH environment variable",
    'I need to specify a path'
  )

const pickCliPath = async () => {
  const isGlobal = await pickIsCliGlobal()

  if (isGlobal === undefined) {
    return
  }

  if (isGlobal) {
    return setDvcPath('dvc')
  }

  return pickFileOrEnterPath()
}

const pickIsDVCInVenv = () =>
  pickYesOrNo(
    'is DVC installed within the environment?',
    "all of the project's requirements are in the virtual environment",
    'this project needs access to a DVC CLI outside of the virtual environment'
  )

const pickVenvOptions = async () => {
  const dvcInVenv = await pickIsDVCInVenv()
  if (dvcInVenv === undefined) {
    return
  }

  if (dvcInVenv) {
    return setDvcPath(undefined)
  }

  return pickCliPath()
}

const pickUsesVenv = () =>
  pickYesOrNo(
    'Does your project use a Python virtual environment?',
    'needs ms-python extension installed',
    'all of the modules required to run this project are globally available'
  )

export const setupWorkspace = async (): Promise<void | undefined> => {
  // insert 3rd option to select interpreter
  const usesVenv = await pickUsesVenv()

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
