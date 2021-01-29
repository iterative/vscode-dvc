import { extensions, Terminal, window } from 'vscode'
import { delay } from './util'

// Static class that creates and holds a reference to an integrated terminal and can run commands in it.
export class IntegratedTerminal {
  static termName = 'DVC'
  static term: Terminal | undefined

  static _createTerminal = async (): Promise<void> => {
    // if user closes the terminal, delete our reference:
    window.onDidCloseTerminal(async event => {
      if (
        IntegratedTerminal.term &&
        event.name === IntegratedTerminal.termName
      ) {
        IntegratedTerminal.term = undefined
      }
    })

    const pythonInterpreter = extensions.getExtension('ms-python.python')
    if (pythonInterpreter && !pythonInterpreter.isActive) {
      await pythonInterpreter.activate()
      await delay(2000)
    }
    IntegratedTerminal.term = window.createTerminal({
      name: IntegratedTerminal.termName
      // hideFromUser: true <- cannot use this as the python extension will not activate the environment
      // https://github.com/microsoft/vscode-python/issues/11122
    })
    await delay(5000)
  }

  static _term = async (): Promise<Terminal | undefined> => {
    if (!IntegratedTerminal.term) {
      await IntegratedTerminal._createTerminal()
    }
    return IntegratedTerminal.term
  }

  static run = async (command: string): Promise<void> => {
    const term = await IntegratedTerminal._term()
    term?.show(true)
    return term?.sendText(command, true)
  }

  static dispose = (): void => {
    const term = IntegratedTerminal.term
    if (term) {
      term.dispose()
      IntegratedTerminal.term = undefined
    }
  }
}
