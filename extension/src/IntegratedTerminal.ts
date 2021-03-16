import { relative } from 'path'
import { Extension, extensions, Terminal, Uri, window, workspace } from 'vscode'
import {
  getAddCommand,
  getCheckoutCommand,
  getCommitCommand,
  getDestroyCommand,
  getFetchCommand,
  getGcCommand,
  getInitCommand,
  getInstallCommand,
  getListCommand,
  getPullCommand,
  getPushCommand,
  getRunExperimentCommand,
  getStatusCommand
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

export const getDefaultCwd = (): string => {
  const { workspaceFolders } = workspace
  if (!workspaceFolders || workspaceFolders.length === 0) {
    throw new Error('There are no folders in the Workspace to operate on!')
  }

  return workspaceFolders[0].uri.path
}

export const runExperiment = (): Promise<void> => {
  const runExperimentCommand = getRunExperimentCommand()
  return IntegratedTerminal.run(runExperimentCommand)
}

export const add = (item: string, options: string[] = []): Promise<void> => {
  const path = Uri.file(relative(getDefaultCwd(), item)).path
  const addCommand = getAddCommand(path, options)
  return IntegratedTerminal.run(addCommand)
}

export const checkout = (
  item: string,
  options: string[] = []
): Promise<void> => {
  const checkoutCommand = getCheckoutCommand(item, options)
  return IntegratedTerminal.run(checkoutCommand)
}

export const commit = (): Promise<void> => {
  const commitCommand = getCommitCommand(getDefaultCwd())
  return IntegratedTerminal.run(commitCommand)
}

export const destroy = (): Promise<void> => {
  const destroyCommand = getDestroyCommand(getDefaultCwd())
  return IntegratedTerminal.run(destroyCommand)
}

export const fetch = (item: string, options: string[] = []): Promise<void> => {
  const fetchCommand = getFetchCommand(item, options)
  return IntegratedTerminal.run(fetchCommand)
}

export const gc = (item: string, options: string[] = []): Promise<void> => {
  const gcCommand = getGcCommand(item, options)
  return IntegratedTerminal.run(gcCommand)
}

export const initialize = (
  item: string,
  options: string[] = []
): Promise<void> => {
  const initializeCommand = getInitCommand(item, options)
  return IntegratedTerminal.run(initializeCommand)
}

export const install = (): Promise<void> => {
  const installCommand = getInstallCommand(getDefaultCwd())
  return IntegratedTerminal.run(installCommand)
}

export const list = (): Promise<void> => {
  const listCommand = getListCommand(getDefaultCwd())
  return IntegratedTerminal.run(listCommand)
}

export const pull = (): Promise<void> => {
  const pullCommand = getPullCommand(getDefaultCwd())
  return IntegratedTerminal.run(pullCommand)
}

export const push = (item: string, options: string[] = []): Promise<void> => {
  const path = Uri.file(relative(getDefaultCwd(), item)).path
  const pushCommand = getPushCommand(path, options)
  return IntegratedTerminal.run(pushCommand)
}

export const status = (): Promise<void> => {
  const statusCommand = getStatusCommand(getDefaultCwd())
  return IntegratedTerminal.run(statusCommand)
}
