import { Extension, extensions, Terminal, window, workspace } from 'vscode'
import { delay } from './util'

// Static class that creates and holds a reference to an integrated terminal and can run commands in it.
export class IntegratedTerminal {
  static termName = 'DVC'
  static instance: Terminal | undefined

  static _initializeInstance = async (): Promise<void> => {
    IntegratedTerminal._deleteReferenceOnClose()

    const pythonExtension = extensions.getExtension('ms-python.python')
    if (
      pythonExtension &&
      workspace.getConfiguration().get('python.terminal.activateEnvironment')
    ) {
      return IntegratedTerminal._createPythonInstance(pythonExtension)
    }

    return IntegratedTerminal._createInstance(2000)
  }

  static _createPythonInstance = async (
    pythonExtension: Extension<any>
  ): Promise<void> => {
    if (!pythonExtension.isActive) {
      await IntegratedTerminal._activateExtension(pythonExtension)
    }
    return IntegratedTerminal._createInstance(5000)
  }

  static _deleteReferenceOnClose = (): void => {
    window.onDidCloseTerminal(async event => {
      if (
        IntegratedTerminal.instance &&
        event.name === IntegratedTerminal.termName
      ) {
        IntegratedTerminal.instance = undefined
      }
    })
  }

  static _activateExtension = async (
    extension: Extension<any>
  ): Promise<void> => {
    await extension.activate()
    return delay(2000)
  }

  static _createInstance = async (ms: number): Promise<void> => {
    IntegratedTerminal.instance = window.createTerminal({
      name: IntegratedTerminal.termName
      // hideFromUser: true <- cannot use this as the python extension will not activate the environment
      // https://github.com/microsoft/vscode-python/issues/11122
    })
    return delay(ms)
  }

  static openCurrentInstance = async (): Promise<Terminal | undefined> => {
    if (!IntegratedTerminal.instance) {
      await IntegratedTerminal._initializeInstance()
    }
    IntegratedTerminal.instance?.show(true)
    return IntegratedTerminal.instance
  }

  static run = async (command: string): Promise<void> => {
    const currentTerminal = await IntegratedTerminal.openCurrentInstance()
    return currentTerminal?.sendText(command, true)
  }

  static dispose = (): void => {
    const currentTerminal = IntegratedTerminal.instance
    if (currentTerminal) {
      currentTerminal.dispose()
      IntegratedTerminal.instance = undefined
    }
  }
}
