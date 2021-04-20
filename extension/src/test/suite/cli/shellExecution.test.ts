import { describe, it } from 'mocha'
import chai from 'chai'
import { stub } from 'sinon'
import sinonChai from 'sinon-chai'
import { Event, EventEmitter, window } from 'vscode'
import * as ExecutionDetails from '../../../cli/executionDetails'
import { executeInShell } from '../../../cli/shellExecution'
import { Commands } from '../../../cli/commands'
import { Disposable, Disposer } from '../../../extension'

chai.use(sinonChai)
const { expect } = chai

suite('Shell Execution Test Suite', () => {
  window.showInformationMessage('Start all shell execution tests.')

  describe('shellExecution', () => {
    it('should be able to execute a shell command and provide the correct events in the correct order', async () => {
      const disposable = Disposable.fn()

      const text = ':weeeee:'
      const command = 'echo ' + text

      const completedEventEmitter = new EventEmitter<void>()
      const stdOutEventEmitter = new EventEmitter<string>()
      const startedEventEmitter = new EventEmitter<void>()

      const onDidStart = startedEventEmitter.event
      const onDidComplete = completedEventEmitter.event
      const onDidOutput = stdOutEventEmitter.event

      const shellExecutionOutputEvent = (
        text: string,
        event: Event<string>,
        disposer: Disposer
      ): Promise<string> => {
        let eventStream = ''
        return new Promise(resolve => {
          const listener: Disposable = event((event: string) => {
            eventStream += event
            if (eventStream.includes(`${text}`)) {
              return resolve(eventStream)
            }
          })
          disposer.track(listener)
        })
      }
      const startedOrCompletedEvent = (event: Event<void>): Promise<void> => {
        return new Promise(resolve => {
          const listener: Disposable = event(() => {
            listener.dispose()
            return resolve()
          })
        })
      }
      const started = startedOrCompletedEvent(onDidStart)
      const completed = startedOrCompletedEvent(onDidComplete)
      const eventStream = shellExecutionOutputEvent(
        text,
        onDidOutput,
        disposable
      )

      const stubbedGetCommand = stub(ExecutionDetails, 'getCommand').returns(
        command
      )

      const cwd = __dirname

      executeInShell({
        options: {
          command: Commands.STATUS,
          cliPath: undefined,
          cwd,
          pythonBinPath: undefined
        },
        emitters: {
          completedEventEmitter,
          stdOutEventEmitter,
          startedEventEmitter
        }
      })
      stubbedGetCommand.restore()

      await started
      expect((await eventStream).includes(text)).to.be.true
      await completed
      expect(stubbedGetCommand).to.be.calledWith(
        'status --show-json',
        undefined
      )
      disposable.dispose()
    }).timeout(12000)
  })
})
