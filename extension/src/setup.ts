import { IExtension } from './interfaces'
import { getInput } from './vscode/inputBox'
import { quickPickValue } from './vscode/quickPick'
import { setConfigValue } from './vscode/config'
import { pickFile } from './vscode/pickFile'

const setDvcPath = (path: string | undefined) =>
  setConfigValue('dvc.dvcPath', path)

const pickFileOrEnterPath = async () => {
  const pickedOption = await quickPickValue(
    [
      {
        label: 'Enter a value',
        value: 'enter'
      },
      {
        description: 'Browse the filesystem for a DVC executable',
        label: 'Find',
        value: 'pick'
      }
    ],
    { placeHolder: 'is DVC available globally?' }
  )

  if (pickedOption === undefined) {
    return
  }

  if (pickedOption === 'enter') {
    const value = await getInput('Enter the path to DVC')
    if (!value) {
      return
    }

    return setDvcPath(value)
  }

  const path = await pickFile('Select a DVC executable')
  if (!path) {
    return
  }
  return setDvcPath(path)
}

const chooseCliPath = async () => {
  const dvcGlobal = await quickPickValue(
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

  if (dvcGlobal === undefined) {
    return
  }

  if (dvcGlobal) {
    return setDvcPath('dvc')
  }

  return pickFileOrEnterPath()
}

const pickVenvOptions = async () => {
  const dvcInVenv = await quickPickValue(
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
  if (dvcInVenv === undefined) {
    return
  }

  if (dvcInVenv) {
    return setDvcPath(undefined)
  }

  return chooseCliPath()
}

export const setupWorkspace = async (): Promise<void | undefined> => {
  // insert 3rd option to select interpreter
  const usesVenv = await quickPickValue(
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

  if (usesVenv === undefined) {
    return
  }

  if (usesVenv) {
    return pickVenvOptions()
  }

  return chooseCliPath()
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
