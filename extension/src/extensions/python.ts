import { relative } from 'path'
import { commands, Event, Uri } from 'vscode'
import { executeProcess } from '../processExecution'
import { getExtensionAPI, isInstalled } from '../vscode/extensions'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { isSameOrChild } from '../fileSystem'

const PYTHON_EXTENSION_ID = 'ms-python.python'

interface Settings {
  onDidChangeExecutionDetails: Event<Uri | undefined>
  getExecutionDetails: () => {
    execCommand: string[] | undefined
  }
}

export interface VscodePython {
  ready: Thenable<void>
  settings: Settings
}

const getPythonExtensionSettings = async (): Promise<Settings | undefined> => {
  const api = await getExtensionAPI<VscodePython>(PYTHON_EXTENSION_ID)
  if (!api) {
    return
  }
  try {
    await api.ready
  } catch {}
  return api.settings
}

export const getPythonExecutionDetails = async (): Promise<
  string[] | undefined
> => {
  const settings = await getPythonExtensionSettings()
  return settings?.getExecutionDetails().execCommand
}

export const getPythonBinPath = async (): Promise<string | undefined> => {
  const pythonExecutionDetails = await getPythonExecutionDetails()
  const pythonBin = pythonExecutionDetails?.join(' ')
  if (pythonBin) {
    try {
      return await executeProcess({
        args: ['-c', 'import sys; print(sys.executable)'],
        cwd: process.cwd(),
        executable: pythonBin
      })
    } catch {}
  }
}

export const getPythonInterpreterStr = async (): Promise<
  string | undefined
> => {
  const pythonBinPath = await getPythonBinPath()

  const firstWorkspaceFolder = getFirstWorkspaceFolder()

  if (
    !(
      firstWorkspaceFolder &&
      pythonBinPath &&
      isSameOrChild(firstWorkspaceFolder, pythonBinPath)
    )
  ) {
    return pythonBinPath
  }
  return relative(firstWorkspaceFolder, pythonBinPath)
}

export const getOnDidChangePythonExecutionDetails = async () => {
  const settings = await getPythonExtensionSettings()
  return settings?.onDidChangeExecutionDetails
}

export const isPythonExtensionInstalled = () => isInstalled(PYTHON_EXTENSION_ID)

export const selectPythonInterpreter = () => {
  commands.executeCommand('python.setInterpreter')
}
