import { IExtension } from './interfaces'
import {
  quickPickOneOrInput,
  quickPickValue,
  quickPickYesOrNo
} from './vscode/quickPick'
import { setConfigValue } from './vscode/config'
import { pickFile } from './vscode/resourcePicker'
import { getFirstWorkspaceFolder } from './vscode/workspaceFolders'
import { Response } from './vscode/response'
import { getSelectTitle, Title } from './vscode/title'
import { Toast } from './vscode/toast'

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
    {
      defaultValue: 'pick',
      placeholder: `Enter path to a ${text}`,
      title: Title.SETUP_WORKSPACE
    }
  )

const findPath = async (option: string, text: string) => {
  const title = getSelectTitle(text)
  const path = await pickFile(title)
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
    "DVC can be located via the system's PATH environment variable",
    'I need to specify a path',
    { placeHolder: 'Is DVC available globally?', title: Title.SETUP_WORKSPACE }
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
    "all of the project's requirements are in the virtual environment",
    'this project needs access to a DVC CLI outside of the virtual environment',
    {
      placeHolder: 'Is DVC installed within the environment?',
      title: Title.SETUP_WORKSPACE
    }
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
        label: Response.YES,
        value: 2
      },
      {
        description: 'and I want to select the python interpreter',
        label: Response.YES,
        value: 1
      },

      {
        description:
          'all of the modules required to run this project are globally available',
        label: 'No',
        value: 0
      }
    ],
    {
      placeHolder: 'Does your project use a Python virtual environment?',
      title: Title.SETUP_WORKSPACE
    }
  )

const quickPickOrUnsetPythonInterpreter = (usesVenv: number) => {
  if (usesVenv === 1) {
    return enterPathOrPickFile('dvc.pythonPath', 'Python Interpreter')
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

const extensionCanRunCli = async (
  extension: IExtension,
  cwd: string
): Promise<boolean> => {
  let canRunCli = false
  try {
    canRunCli = await extension.canRunCli(cwd)
  } catch {
    if (extension.hasRoots()) {
      Toast.warnWithOptions(
        'An error was thrown when trying to access the CLI.'
      )
    }
  }
  return canRunCli
}

export const setup = async (extension: IExtension) => {
  const cwd = getFirstWorkspaceFolder()
  if (!cwd) {
    return
  }

  extension.setRoots()

  const isCliAvailable = await extensionCanRunCli(extension, cwd)

  if (extension.hasRoots() && isCliAvailable) {
    return extension.initialize()
  }

  extension.reset()
}
