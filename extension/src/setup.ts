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

const pickIsCliGlobal = () =>
  quickPickValue(
    [
      {
        description:
          "DVC can be located via the system's PATH environment variable",
        label: 'Yes',
        value: true
      },
      {
        description: 'I need to specify a path',
        label: 'No',
        value: false
      }
    ],
    { placeHolder: 'is DVC available globally?' }
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
  quickPickValue(
    [
      {
        description:
          "all of the project's requirements are in the virtual environment",
        label: 'Yes',
        value: true
      },
      {
        description:
          'this project needs access to a DVC CLI outside of the virtual environment',
        label: 'No',
        value: false
      }
    ],
    { placeHolder: 'is DVC installed within the environment?' }
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
  quickPickValue(
    [
      {
        description: 'needs ms-python extension installed',
        label: 'Yes',
        value: true
      },
      {
        description:
          'all of the modules required to run this project are globally available',
        label: 'No',
        value: false
      }
    ],
    { placeHolder: 'Does your project use a Python virtual environment?' }
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
