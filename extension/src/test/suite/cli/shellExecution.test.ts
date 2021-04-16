import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Terminal, TerminalDataWriteEvent, window } from 'vscode'
import { run } from '../../../cli/shellExecution'
import { Disposable, Disposer } from '../../../extension'
import { PseudoTerminal } from '../../../PseudoTerminal'

chai.use(sinonChai)
const { expect } = chai

suite('Pseudo Terminal Test Suite', () => {
  window.showInformationMessage('Start all integrated terminal tests.')

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
      disposable.track(PseudoTerminal)

      const text = 'some-really-long-string'

      const command = 'echo ' + text

      const executionDetails = {
        cwd: __dirname,
        env: process.env,
        executionCommand: command,
        outputCommand: command
      }

      run(executionDetails)

      const eventStream = await terminalDataWriteEventStream(text, disposable)
      expect(eventStream.includes(text)).to.be.true

      disposable.dispose()
      return closeTerminalEvent()
    }).timeout(12000)

    it('should be able to run multiple commands in the same terminal', async () => {
      const disposable = Disposable.fn()
      disposable.track(PseudoTerminal)

      const firstText = 'some-really-long-string'
      const secondText = ':weeeee:'

      const firstEvent = terminalDataWriteEventStream(firstText, disposable)
      const firstCommand = 'echo ' + firstText
      const firstExecutionDetails = {
        cwd: __dirname,
        env: process.env,
        executionCommand: firstCommand,
        outputCommand: firstCommand
      }

      const secondEvent = terminalDataWriteEventStream(secondText, disposable)
      const secondCommand = 'echo ' + secondText
      const secondExecutionDetails = {
        cwd: __dirname,
        env: process.env,
        executionCommand: secondCommand,
        outputCommand: secondCommand
      }

      await run(firstExecutionDetails)
      await run(secondExecutionDetails)

      const firstStream = await Promise.race([firstEvent, secondEvent])
      let eventStream = await firstEvent
      expect(firstStream).to.equal(eventStream)

      eventStream += await secondEvent

      expect(eventStream.includes(firstText)).to.be.true
      expect(eventStream.includes(secondText)).to.be.true

      disposable.dispose()
      return closeTerminalEvent()
    }).timeout(12000)
  })
})
