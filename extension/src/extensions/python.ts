import { commands, Event, Uri } from 'vscode'
import { findPythonBin } from '../python'
import { getExtensionAPI, isInstalled } from '../vscode/extensions'

const PYTHON_EXTENSION_ID = 'ms-python.python'

interface Settings {
  onDidChangeExecutionDetails: Event<Uri | undefined>
  getExecutionDetails: () => {
    execCommand: string[] | undefined
  }
}

type EnvironmentVariables = { readonly [key: string]: string | undefined }
type EnvironmentVariablesChangeEvent = {
  readonly env: EnvironmentVariables
}

export interface VscodePython {
  ready: Thenable<void>
  settings: Settings
  environments: {
    onDidEnvironmentVariablesChange: Event<EnvironmentVariablesChangeEvent>
    getEnvironmentVariables(): EnvironmentVariables
  }
}

const getPythonExtensionAPI = async (): Promise<VscodePython | undefined> => {
  const api = await getExtensionAPI<VscodePython>(PYTHON_EXTENSION_ID)
  if (!api) {
    return
  }
  try {
    await api.ready
  } catch {}
  return api
}

export const getPythonExecutionDetails = async (): Promise<
  string[] | undefined
> => {
  const api = await getPythonExtensionAPI()
  return api?.settings?.getExecutionDetails().execCommand
}

export const getPythonBinPath = async (): Promise<string | undefined> => {
  const pythonExecutionDetails = await getPythonExecutionDetails()
  const pythonBin = pythonExecutionDetails?.join(' ')
  if (pythonBin) {
    return findPythonBin(pythonBin)
  }
}

export const getPYTHONPATH = async (): Promise<string | undefined> => {
  const api = await getPythonExtensionAPI()
  return api?.environments?.getEnvironmentVariables().PYTHONPATH
}

export const getOnDidChangePythonExecutionDetails = async () => {
  const api = await getPythonExtensionAPI()
  return api?.settings?.onDidChangeExecutionDetails
}

export const getOnDidChangePythonEnvironmentVariables = async () => {
  const api = await getPythonExtensionAPI()
  return api?.environments?.onDidEnvironmentVariablesChange
}

export const isPythonExtensionInstalled = () => isInstalled(PYTHON_EXTENSION_ID)

export const selectPythonInterpreter = () => {
  void commands.executeCommand('python.setInterpreter')
}
