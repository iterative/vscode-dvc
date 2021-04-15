import { spawn } from 'child_process'
import { EventEmitter, Pseudoterminal, Terminal, window } from 'vscode'
import { cliExecutionDetails } from './cli/shellExecution'

const writeEmitter = new EventEmitter<string>()
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

  static run = async (executionDetails: cliExecutionDetails): Promise<void> =>
    new Promise(resolve => {
      const { cwd, env, executionCommand, outputCommand } = executionDetails
      PseudoTerminal.openCurrentInstance().then(() => {
        writeEmitter.fire(`${outputCommand}\r\n`)

        const options = {
          cwd,
          env,
          shell: true
        }
        const childProcess = spawn(`${executionCommand}`, options)

        childProcess.stdout?.on('data', stdout => {
          const output = stdout
            .toString()
            .split(/(\r?\n)/g)
            .join('\r')
          writeEmitter.fire(output)
        })

        childProcess.stderr?.on('data', stdout => {
          const output = stdout
            .toString()
            .split(/(\r?\n)/g)
            .join('\r')
          writeEmitter.fire(output)
        })

        childProcess.on('close', () => {
          writeEmitter.fire(
            '\r\nTerminal will be reused by DVC, press any key to close it\r\n\n'
          )
          resolve()
        })
      })
    })

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

  private static createInstance = async (): Promise<void> =>
    new Promise<void>(resolve => {
      const pty: Pseudoterminal = {
        onDidWrite: writeEmitter.event,
        open: () => {
          writeEmitter.fire('>>>> DVC Terminal >>>>\r\n\n')
          resolve()
        },
        close: () => {},
        handleInput: data => writeEmitter.fire(data === '\r' ? '\r\n' : data)
      }

      PseudoTerminal.instance = window.createTerminal({
        name: PseudoTerminal.termName,
        pty
      })
    })
}
