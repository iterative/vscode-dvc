import { describe, it } from 'mocha'
import chai from 'chai'
import { stub } from 'sinon'
import sinonChai from 'sinon-chai'
import { Event, EventEmitter, window } from 'vscode'
import * as Execution from '../../../cli/execution'
import { Disposable, Disposer } from '../../../extension'

chai.use(sinonChai)
const { expect } = chai

suite('Execution Test Suite', () => {
  window.showInformationMessage('Start all execution tests.')

  const { createCliProcess } = Execution

  describe('createCliProcess', () => {
    it('should be able to execute a command and provide the correct events in the correct order', async () => {
      const disposable = Disposable.fn()

      const text = ':weeeee:'

      const completedEventEmitter = new EventEmitter<void>()
      const outputEventEmitter = new EventEmitter<string>()
      const startedEventEmitter = new EventEmitter<void>()

      const onDidStart = startedEventEmitter.event
      const onDidComplete = completedEventEmitter.event
      const onDidOutput = outputEventEmitter.event

      const executionOutputEvent = (
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
      const eventStream = executionOutputEvent(text, onDidOutput, disposable)

      const cwd = __dirname
      const args = [text]

      const stubbedGetExecutionDetails = stub(
        Execution,
        'getExecutionDetails'
      ).returns({ executable: 'echo', cwd, env: {} })

      createCliProcess({
        options: {
          cliPath: undefined,
          cwd,
          pythonBinPath: undefined
        },
        emitters: {
          completedEventEmitter,
          outputEventEmitter: outputEventEmitter,
          startedEventEmitter
        },
        args
      })
      stubbedGetExecutionDetails.restore()

      await started
      expect((await eventStream).includes(text)).to.be.true
      await completed
      expect(stubbedGetExecutionDetails).to.be.calledWith({
        cliPath: undefined,
        cwd,
        pythonBinPath: undefined
      })
      disposable.dispose()
    }).timeout(12000)
  })
})
