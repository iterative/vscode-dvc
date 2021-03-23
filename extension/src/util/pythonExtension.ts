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

export const getPythonExtension: () => Thenable<
  PythonExtension | undefined
> = async () => {
  const extension = extensions.getExtension('ms-python.python')
  return extension || undefined
}

export const getActivatedPythonExtension: () => Thenable<
  PythonExtension | undefined
> = async () => {
  const extension = await getPythonExtension()
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

export const getPythonExecutionDetails: () => Thenable<string[]> = async () => {
  const extension = await getReadyPythonExtension()
  if (!extension) return []
  const { execCommand } = extension.exports.settings.getExecutionDetails()
  return execCommand || []
}
