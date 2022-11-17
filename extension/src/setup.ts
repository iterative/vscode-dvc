import { IExtension } from './interfaces'
import {
  quickPickOneOrInput,
  quickPickValue,
  quickPickYesOrNo
} from './vscode/quickPick'
import { ConfigKey, setConfigValue } from './vscode/config'
import { pickFile } from './vscode/resourcePicker'
import { getFirstWorkspaceFolder } from './vscode/workspaceFolders'
import { getSelectTitle, Title } from './vscode/title'
import { isPythonExtensionInstalled } from './extensions/python'
import { extensionCanRunCli } from './cli/dvc/discovery'

const setConfigPath = async (
  option: ConfigKey,
  path: string | undefined
): Promise<true> => {
  await setConfigValue(option, path)
  return true
}

const setDvcPath = (path: string | undefined) =>
  setConfigPath(ConfigKey.DVC_PATH, path)

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

const findPath = async (option: ConfigKey, text: string) => {
  const title = getSelectTitle(text)
  const path = await pickFile(title)
  if (!path) {
    return false
  }
  return setConfigPath(option, path)
}

const enterPathOrPickFile = async (option: ConfigKey, description: string) => {
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

  return enterPathOrPickFile(ConfigKey.DVC_PATH, 'DVC CLI')
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

const quickPickVenvOption = () => {
  const options = [
    {
      description: '• Let me select the virtual environment manually',
      label: 'Manual',
      value: 1
    },
    {
      description: '• DVC is available globally (e.g. installed as a binary)',
      label: 'Global',
      value: 0
    }
  ]
  if (isPythonExtensionInstalled()) {
    options.unshift({
      description:
        '• Use the virtual environment detected automatically by the Python extension',
      label: 'Auto',
      value: 2
    })
  }

  return quickPickValue<number>(options, {
    placeHolder: 'Select an environment where DVC is installed',
    title: Title.SETUP_WORKSPACE
  })
}

const quickPickOrUnsetPythonInterpreter = (usesVenv: number) => {
  if (usesVenv === 1) {
    return enterPathOrPickFile(ConfigKey.PYTHON_PATH, 'Python Interpreter')
  }

  return setConfigPath(ConfigKey.PYTHON_PATH, undefined)
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
  const cwd = getFirstWorkspaceFolder()
  if (!cwd) {
    return
  }

  await extension.setRoots()

  const { isAvailable, isCompatible } = await extensionCanRunCli(extension, cwd)

  extension.setCliCompatible(isCompatible)
  extension.setAvailable(isAvailable)

  if (extension.hasRoots() && isAvailable) {
    return extension.initialize()
  }

  extension.resetMembers()

  if (!isAvailable) {
    extension.setAvailable(false)
  }
}
