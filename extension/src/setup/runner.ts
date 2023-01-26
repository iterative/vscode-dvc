import { IExtensionSetup } from '../interfaces'
import {
  quickPickOneOrInput,
  quickPickValue,
  quickPickYesOrNo
} from '../vscode/quickPick'
import { ConfigKey, setConfigValue } from '../vscode/config'
import { pickFile } from '../vscode/resourcePicker'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { getSelectTitle, Title } from '../vscode/title'
import {
  isPythonExtensionInstalled,
  selectPythonInterpreter
} from '../extensions/python'
import { extensionCanRunCli, recheck } from '../cli/dvc/discovery'

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
    isPythonExtensionInstalled()
      ? {
          description:
            '• Use the virtual environment detected by the Python extension',
          label: 'Auto',
          value: 2
        }
      : {
          description: '• Select the virtual environment',
          label: 'Manual',
          value: 1
        },
    {
      description: '• DVC is available globally (e.g. installed as a binary)',
      label: 'Global',
      value: 0
    }
  ]

  return quickPickValue<number>(options, {
    placeHolder: 'Select an environment where DVC is installed',
    title: Title.SETUP_WORKSPACE
  })
}

const manuallySelectInterpreter = async () => {
  const interpreterSet = await enterPathOrPickFile(
    ConfigKey.PYTHON_PATH,
    'Python Interpreter'
  )
  if (!interpreterSet) {
    return false
  }
  return pickVenvOptions()
}

const selectInterpreter = async (
  usesVenv: number,
  setConfigToUsePythonExtension: () => Promise<void>
) => {
  if (usesVenv === 1) {
    return manuallySelectInterpreter()
  }

  await Promise.all([
    setConfigPath(ConfigKey.PYTHON_PATH, undefined),
    setConfigPath(ConfigKey.DVC_PATH, undefined)
  ])

  await setConfigToUsePythonExtension()

  selectPythonInterpreter()
  return true
}

export const runWorkspace = async (
  setConfigToUsePythonExtension: () => Promise<void>
): Promise<boolean> => {
  const usesVenv = await quickPickVenvOption()

  if (usesVenv === undefined) {
    return false
  }

  if (usesVenv) {
    return selectInterpreter(usesVenv, setConfigToUsePythonExtension)
  }

  return pickCliPath()
}

export const checkAvailable = async (
  setup: IExtensionSetup,
  dvcRootOrFirstFolder: string
) => {
  const { isAvailable, isCompatible } = await extensionCanRunCli(
    setup,
    dvcRootOrFirstFolder
  )

  setup.setCliCompatible(isCompatible)
  setup.setAvailable(isAvailable)

  if (setup.hasRoots() && isAvailable) {
    return setup.initialize()
  }

  setup.resetMembers()
}

export const run = async (setup: IExtensionSetup) => {
  const cwd = getFirstWorkspaceFolder()
  if (!cwd) {
    return
  }

  await setup.setRoots()

  const roots = setup.getRoots()
  const dvcRootOrFirstFolder = roots.length > 0 ? roots[0] : cwd

  return checkAvailable(setup, dvcRootOrFirstFolder)
}

export const runWithRecheck = async (
  setup: IExtensionSetup,
  recheckInterval = 5000
): Promise<void> => {
  await run(setup)

  if (!setup.getAvailable()) {
    void recheck(setup, () => run(setup), recheckInterval)
  }
}
