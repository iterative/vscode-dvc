import { extensions, Extension } from 'vscode'

export interface PythonExtensionAPI {
  ready: Thenable<void>
  settings: {
    getExecutionDetails: () => {
      execCommand: string[] | undefined
    }
  }
}

export type PythonExtension = Extension<PythonExtensionAPI>

export const getPythonExtension: () => PythonExtension | undefined = () =>
  extensions.getExtension('ms-python.python')

export const getActivatedPythonExtension: () => Thenable<
  PythonExtension | undefined
> = async () => {
  const extension = getPythonExtension()
  if (!extension) return extension
  if (!extension.isActive) await extension.activate()
  return extension
}

export const getReadyPythonExtension: () => Thenable<
  PythonExtension | undefined
> = async () => {
  const extension = await getActivatedPythonExtension()
  if (!extension) return extension
  await extension.exports.ready
  return extension
}

export const getPythonExecutionDetails: () => Thenable<
  string[] | undefined
> = async () =>
  (await getReadyPythonExtension())?.exports.settings.getExecutionDetails()
    .execCommand
