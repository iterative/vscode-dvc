import { IExtension } from './interfaces'
import {
  quickPickOneOrInput,
  quickPickValue,
  quickPickYesOrNo
} from './vscode/quickPick'
import { setConfigValue } from './vscode/config'
import { pickFile } from './vscode/pickFile'

const setConfigPath = async (
  option: string,
  path: string | undefined
): Promise<true> => {
  await setConfigValue(option, path)
  return true
}

const setDvcPath = (path: string | undefined) =>
  setConfigPath('dvc.dvcPath', path)

const setPythonPath = (path: string | undefined) =>
  setConfigPath('dvc.pythonPath', path)

const enterPathOrFind = (text: string): Promise<string | undefined> =>
  quickPickOneOrInput(
    [
      {
        detail: `Browse the filesystem for a ${text}.`,
        label: 'Find...',
        value: 'pick'
      }
    ],
    `Enter path to a ${text}`,
    'pick'
  )

const findPath = async (option: string, text: string) => {
  const path = await pickFile(`Select a ${text}`)
  if (!path) {
    return false
  }
  return setConfigPath(option, path)
}

const enterPathOrPickFile = async (option: string, description: string) => {
  const pickOrPath = await enterPathOrFind(description)

  if (pickOrPath === undefined) {
    return false
  }

  if (pickOrPath !== 'pick') {
    return setConfigPath(option, pickOrPath)
  }

  return findPath(option, description)
}

const pickCliPath = async () => {
  const isGlobal = await quickPickYesOrNo(
    'Is DVC available globally?',
    "DVC can be located via the system's PATH environment variable",
    'I need to specify a path'
  )

  if (isGlobal === undefined) {
    return false
  }

  if (isGlobal) {
    return setDvcPath('dvc')
  }

  return enterPathOrPickFile('dvc.dvcPath', 'DVC CLI')
}

const pickVenvOptions = async () => {
  const dvcInVenv = await quickPickYesOrNo(
    'Is DVC installed within the environment?',
    "all of the project's requirements are in the virtual environment",
    'this project needs access to a DVC CLI outside of the virtual environment'
  )
  if (dvcInVenv === undefined) {
    return false
  }

  if (dvcInVenv) {
    return setDvcPath(undefined)
  }

  return pickCliPath()
}

const quickPickVenvOption = () =>
  quickPickValue<number>(
    [
      {
        description: 'use the interpreter selected by the ms-python extension',
        label: 'Yes',
        value: 2
      },
      {
        description: 'and I want to select the python interpreter',
        label: 'Yes',
        value: 1
      },

      {
        description:
          'all of the modules required to run this project are globally available',
        label: 'No',
        value: 0
      }
    ],
    { placeHolder: 'Does your project use a Python virtual environment?' }
  )

const quickPickOrUnsetPythonInterpreter = (usesVenv: number) => {
  if (usesVenv === 1) {
    return enterPathOrPickFile('dvc.pythonPath', 'Python interpreter')
  }

  return setPythonPath(undefined)
}

export const setupWorkspace = async (): Promise<boolean> => {
  const usesVenv = await quickPickVenvOption()

  if (usesVenv === undefined) {
    return false
  }

  if (usesVenv) {
    if (!(await quickPickOrUnsetPythonInterpreter(usesVenv))) {
      return false
    }

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

  const canRunCli = await extension.canRunCli()
  if (extension.hasRoots() && canRunCli) {
    return extension.initialize()
  }

  extension.reset()
}
