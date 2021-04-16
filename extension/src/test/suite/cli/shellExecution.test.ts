import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Event, EventEmitter, window } from 'vscode'
import { ShellExecution } from '../../../cli/shellExecution'
import { Disposable, Disposer } from '../../../extension'
import { PseudoTerminal } from '../../../PseudoTerminal'
import { Config } from '../../../Config'
import { Commands } from '../../../cli/commands'
import { stub } from 'sinon'

chai.use(sinonChai)
const { expect } = chai

suite('ShellExecution', () => {
  window.showInformationMessage('Start all shell execution tests.')

  describe('ShellExecution', () => {
    it('should be able to execute a shell command and provide the correct events in the correct order', async () => {
      const disposable = Disposable.fn()
      const pseudoTerminal = new PseudoTerminal()
      disposable.track(pseudoTerminal)

      const text = 'some-really-long-string'

      const command = 'echo ' + text

      const completedEventEmitter = new EventEmitter<void>()
      const outputEventEmitter = new EventEmitter<string>()
      const startedEventEmitter = new EventEmitter<void>()

      const onDidStart = startedEventEmitter.event
      const onDidComplete = completedEventEmitter.event
      const onDidOutput = outputEventEmitter.event

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
      const startOrCompletedEvent = (event: Event<void>): Promise<void> => {
        return new Promise(resolve => {
          const listener: Disposable = event(() => {
            listener.dispose()
            return resolve()
          })
        })
      }
      const started = startOrCompletedEvent(onDidStart)
      const completed = startOrCompletedEvent(onDidComplete)
      const eventStream = shellExecutionOutputEvent(
        text,
        onDidOutput,
        disposable
      )

      const shellExecuter = disposable.track(
        new ShellExecution({} as Config, {
          completedEventEmitter,
          outputEventEmitter,
          startedEventEmitter
        })
      )

      stub(shellExecuter, 'getCommand').returns(command)

      shellExecuter.run(Commands.EXPERIMENT_GC, __dirname)

      await started
      expect((await eventStream).includes(text)).to.be.true
      await completed
      disposable.dispose()
    }).timeout(12000)
  })
})
