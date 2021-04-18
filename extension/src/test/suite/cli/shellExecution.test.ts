import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Terminal, TerminalDataWriteEvent, window } from 'vscode'
import { executeInShell } from '../../../cli/shellExecution'
import { Disposable, Disposer } from '../../../extension'
import { PseudoTerminal } from '../../../PseudoTerminal'

chai.use(sinonChai)
const { expect } = chai

suite('Shell Execution Test Suite', () => {
  window.showInformationMessage('Start all shell execution tests.')

  const closeTerminalEvent = (): Promise<Terminal> => {
    return new Promise(resolve => {
      const listener: Disposable = window.onDidCloseTerminal(
        (event: Terminal) => {
          listener.dispose()
          return resolve(event)
        }
      )
    })
  }

  const terminalDataWriteEventStream = (
    text: string,
    disposer: Disposer
  ): Promise<string> => {
    let eventStream = ''
    return new Promise(resolve => {
      const listener: Disposable = window.onDidWriteTerminalData(
        (event: TerminalDataWriteEvent) => {
          eventStream += event.data
          if (eventStream.includes(text)) {
            return resolve(eventStream)
          }
        }
      )
      disposer.track(listener)
    })
  }

  describe('shellExecution', () => {
    it('should be able to run a command', async () => {
      const disposable = Disposable.fn()
      const pseudoTerminal = new PseudoTerminal()
      disposable.track(pseudoTerminal)

      const text = 'some-really-long-string'

      const command = 'echo ' + text

      const executionDetails = {
        cwd: __dirname,
        env: process.env,
        executionCommand: command,
        outputCommand: command
      }

      const eventStream = terminalDataWriteEventStream(text, disposable)
      executeInShell(executionDetails, pseudoTerminal)

      expect((await eventStream).includes(text)).to.be.true

      disposable.dispose()
      return closeTerminalEvent()
    }).timeout(12000)
  })
})
