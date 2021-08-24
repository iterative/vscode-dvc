import { Event, Uri } from 'vscode'
import { executeProcess } from '../processExecution'
import { getExtensionAPI } from '../vscode/extensions'

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

export const getPythonExtensionSettings: () => Thenable<Settings | undefined> =
  async () => {
    const api = await getExtensionAPI<VscodePython>('ms-python.python')
    if (!api) {
      return
    }
    await api.ready
    return api.settings
  }

export const getPythonExecutionDetails: () => Thenable<string[] | undefined> =
  async () =>
    (await getPythonExtensionSettings())?.getExecutionDetails().execCommand

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
