import { Event, Uri } from 'vscode'
import { executeProcess } from '../processExecution'
import { getExtension } from '../vscode/extensions'

interface Settings {
  onDidChangeExecutionDetails: Event<Uri | undefined>
  getExecutionDetails: () => {
    execCommand: string[] | undefined
  }
}

interface ExtensionAPI {
  ready: Thenable<void>
  settings: Settings
}

export const getReadyPythonExtension: () => Thenable<Settings | undefined> =
  async () => {
    const extension = getExtension<ExtensionAPI>('ms-python.python')
    if (!extension) {
      return
    }
    const { ready, settings } = await extension.activate()

    await ready
    return settings
  }

export const getPythonExecutionDetails: () => Thenable<string[] | undefined> =
  async () =>
    (await getReadyPythonExtension())?.getExecutionDetails().execCommand

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
  (await getReadyPythonExtension())?.onDidChangeExecutionDetails
