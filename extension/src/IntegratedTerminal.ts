import { Extension, extensions, Terminal, window, workspace } from 'vscode'
import {
  getRunExperimentCommand,
  getInitializeDirectoryCommand,
  getAddCommand,
  getCheckoutCommand,
  getCheckoutRecursiveCommand,
  getPushCommand
} from './dvcCommands'
import { delay } from './util'

// Static class that creates and holds a reference to an integrated terminal and can run commands in it.
export class IntegratedTerminal {
  static termName = 'DVC'
  private static instance: Terminal | undefined

  static openCurrentInstance = async (): Promise<Terminal | undefined> => {
    if (!IntegratedTerminal.instance) {
      await IntegratedTerminal.initializeInstance()
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

  private static initializeInstance = async (): Promise<void> => {
    IntegratedTerminal.deleteReferenceOnClose()

    const pythonExtension = extensions.getExtension('ms-python.python')
    if (
      pythonExtension &&
      workspace.getConfiguration().get('python.terminal.activateEnvironment')
    ) {
      return IntegratedTerminal.createPythonInstance(pythonExtension)
    }

    return IntegratedTerminal.createInstance(2000)
  }

  private static deleteReferenceOnClose = (): void => {
    window.onDidCloseTerminal(async event => {
      if (
        IntegratedTerminal.instance &&
        event.name === IntegratedTerminal.termName
      ) {
        IntegratedTerminal.instance = undefined
      }
    })
  }

  private static createPythonInstance = async (
    pythonExtension: Extension<
      Thenable<{
        activate: () => void
      }>
    >
  ): Promise<void> => {
    if (!pythonExtension.isActive) {
      await IntegratedTerminal.activateExtension(pythonExtension)
    }
    return IntegratedTerminal.createInstance(5000)
  }

  private static activateExtension = async (
    extension: Extension<
      Thenable<{
        activate: () => void
      }>
    >
  ): Promise<void> => {
    await extension.activate()
    return delay(2500)
  }

  private static createInstance = async (ms: number): Promise<void> => {
    IntegratedTerminal.instance = window.createTerminal({
      name: IntegratedTerminal.termName
      // hideFromUser: true <- cannot use this as the python extension will not activate the environment
      // https://github.com/microsoft/vscode-python/issues/11122
    })
    return delay(ms)
  }
}

export const runExperiment = (): Promise<void> => {
  const runExperimentCommand = getRunExperimentCommand()
  return IntegratedTerminal.run(runExperimentCommand)
}

export const initializeDirectory = (fsPath: string): Promise<void> => {
  const initializeDirectoryCommand = getInitializeDirectoryCommand(fsPath)
  return IntegratedTerminal.run(initializeDirectoryCommand)
}

export const add = (fsPath: string): Promise<void> => {
  const addCommand = getAddCommand(fsPath)
  return IntegratedTerminal.run(addCommand)
}

export const checkout = (fsPath: string): Promise<void> => {
  const checkoutCommand = getCheckoutCommand(fsPath)
  return IntegratedTerminal.run(checkoutCommand)
}

export const checkoutRecursive = (fsPath: string): Promise<void> => {
  const checkoutRecursiveCommand = getCheckoutRecursiveCommand(fsPath)
  return IntegratedTerminal.run(checkoutRecursiveCommand)
}

export const push = (options: DvcTrackedItem | undefined): Promise<void> => {
  const pushCommand = getPushCommand(options)
  return IntegratedTerminal.run(pushCommand)
}
