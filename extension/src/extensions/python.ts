import { Event, extensions, Extension, Uri } from 'vscode'
import { executeProcess } from '../processExecution'

export interface PythonExtensionAPI {
  ready: Thenable<void>
  settings: {
    onDidChangeExecutionDetails: Event<Uri | undefined>
    getExecutionDetails: () => {
      execCommand: string[] | undefined
    }
  }
}

export type PythonExtension = Extension<PythonExtensionAPI>

export const getPythonExtension: () => PythonExtension | undefined = () =>
  extensions.getExtension('ms-python.python')

export const getReadyPythonExtension: () => Thenable<
  PythonExtension | undefined
> = async () => {
  const extension = getPythonExtension()
  if (!extension) {
    return extension
  }
  if (!extension.isActive) {
    await extension.activate()
  }
  await extension.exports.ready
  return extension
}

export const getPythonExecutionDetails: () => Thenable<string[] | undefined> =
  async () =>
    (await getReadyPythonExtension())?.exports.settings.getExecutionDetails()
      .execCommand

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
  (await getReadyPythonExtension())?.exports.settings
    .onDidChangeExecutionDetails
