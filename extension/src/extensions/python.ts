import { Event, Uri } from 'vscode'
import { executeProcess } from '../processExecution'
import { getExtensionAPI, isInstalled } from '../vscode/extensions'

const PYTHON_EXTENSION_ID = 'ms-python.python'

interface Settings {
  onDidChangeExecutionDetails: Event<Uri | undefined>
  getExecutionDetails: () => {
    execCommand: string[] | undefined
  }
}

interface VscodePython {
  ready: Thenable<void>
  settings: Settings
}

export const getPythonExtensionSettings = async (): Promise<
  Settings | undefined
> => {
  const api = await getExtensionAPI<VscodePython>(PYTHON_EXTENSION_ID)
  if (!api) {
    return
  }
  await api.ready
  return api.settings
}

export const getPythonExecutionDetails = async (): Promise<
  string[] | undefined
> => (await getPythonExtensionSettings())?.getExecutionDetails().execCommand

export const getPythonBinPath = async (): Promise<string | undefined> => {
  const pythonExecutionDetails = await getPythonExecutionDetails()
  const pythonBin = pythonExecutionDetails?.join(' ')
  if (pythonBin) {
    return executeProcess({
      args: ['-c', 'import sys; print(sys.executable)'],
      cwd: process.cwd(),
      executable: pythonBin
    })
  }
}

export const getOnDidChangePythonExecutionDetails = async () =>
  (await getPythonExtensionSettings())?.onDidChangeExecutionDetails

export const isPythonExtensionInstalled = () => isInstalled(PYTHON_EXTENSION_ID)
