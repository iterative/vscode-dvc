import { Terminal, window } from 'vscode'
import { Commands } from './cli/commands'

export class PseudoTerminal {
  static termName = 'DVC'
  private static instance: Terminal | undefined

  static openCurrentInstance = async (): Promise<Terminal | undefined> => {
    if (!PseudoTerminal.instance) {
      await PseudoTerminal.initializeInstance()
    }
    PseudoTerminal.instance?.show(true)
    return PseudoTerminal.instance
  }

  static run = async (command: string): Promise<void> => {
    const currentTerminal = await PseudoTerminal.openCurrentInstance()
    return currentTerminal?.sendText(command, true)
  }

  static runCommand = async (command: string): Promise<void> => {
    return PseudoTerminal.run(`dvc ${command}`)
  }

  static dispose = (): void => {
    const currentTerminal = PseudoTerminal.instance
    if (currentTerminal) {
      currentTerminal.dispose()
      PseudoTerminal.instance = undefined
    }
  }

  private static initializeInstance = async (): Promise<void> => {
    PseudoTerminal.deleteReferenceOnClose()
    return PseudoTerminal.createInstance()
  }

  private static deleteReferenceOnClose = (): void => {
    window.onDidCloseTerminal(async event => {
      if (PseudoTerminal.instance && event.name === PseudoTerminal.termName) {
        PseudoTerminal.instance = undefined
      }
    })
  }

  private static createInstance = async (): Promise<void> => {
    PseudoTerminal.instance = window.createTerminal({
      name: PseudoTerminal.termName
    })
  }
}

export const runExperiment = (): Promise<void> => {
  return PseudoTerminal.runCommand(Commands.EXPERIMENT_RUN)
}

export const runQueuedExperiments = (): Promise<void> => {
  return PseudoTerminal.runCommand(Commands.EXPERIMENT_RUN_ALL)
}
