import { IExtension } from './interfaces'
import {
  quickPickOneOrInput,
  quickPickValueWithEvents,
  quickPickYesOrNo
} from './vscode/quickPick'
import { setConfigValue } from './vscode/config'
import { pickFile } from './vscode/pickFile'

const setDvcPath = (path: string | undefined) =>
  setConfigValue('dvc.dvcPath', path)

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
    return
  }
  return setConfigValue(option, path)
}

const enterPathOrPickFile = async (option: string, description: string) => {
  const pickOrPath = await enterPathOrFind(description)

  if (pickOrPath === undefined) {
    return
  }

  if (pickOrPath !== 'pick') {
    return setConfigValue(option, pickOrPath)
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
    return
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
    return
  }

  if (dvcInVenv) {
    return setDvcPath(undefined)
  }

  return pickCliPath()
}

const quickPickVenvOption = () =>
  quickPickValueWithEvents<number>(
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
    'Does your project use a Python virtual environment?'
  )

export const setupWorkspace = async (): Promise<void | undefined> => {
  const usesVenv = await quickPickVenvOption()

  if (usesVenv === undefined) {
    return
  }

  if (usesVenv) {
    usesVenv === 1
      ? await enterPathOrPickFile('dvc.pythonPath', 'Python interpreter')
      : setConfigValue('dvc.pythonPath', undefined)

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
