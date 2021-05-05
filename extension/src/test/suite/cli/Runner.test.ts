import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { restore, spy } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, Event, EventEmitter } from 'vscode'
import { Command } from '../../../cli/args'
import { Disposable, Disposer } from '../../../extension'
import { Config } from '../../../Config'
import { Runner } from '../../../cli/Runner'

chai.use(sinonChai)
const { expect } = chai

suite('Runner Test Suite', () => {
  window.showInformationMessage('Start all runner tests.')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('Runner', () => {
    it('should only be able to run a single command at a time', async () => {
      const runner = disposable.track(new Runner({} as Config, 'sleep'))

      const windowErrorMessageSpy = spy(window, 'showErrorMessage')
      const cwd = __dirname

      await runner.run(cwd, '3')
      await runner.run(cwd, Command.CHECKOUT)

      expect(windowErrorMessageSpy).to.be.calledOnce
    }).timeout(6000)

    it('should be able to stop a started command', async () => {
      const runner = disposable.track(new Runner({} as Config, 'sleep'))
      const cwd = __dirname

      const executeCommandSpy = spy(commands, 'executeCommand')

      const processCompletedEvent = (): Promise<void> =>
        new Promise(resolve =>
          disposable.track(runner.onDidComplete(() => resolve()))
        )

      await runner.run(cwd, '100000000000000000000000')

      const completedEvent = processCompletedEvent()

      expect(runner.isRunning()).to.be.true
      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.runner.running',
        true
      )

      const stopped = await runner.stop()
      expect(stopped).to.be.true

      await completedEvent

      expect(runner.isRunning()).to.be.false
      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.runner.running',
        false
      )
    })

    it('should be able to execute a command and provide the correct events in the correct order', async () => {
      const text = ':weeeee:'

      const completedEventEmitter = disposable.track(new EventEmitter<void>())
      const outputEventEmitter = disposable.track(new EventEmitter<string>())
      const startedEventEmitter = disposable.track(new EventEmitter<void>())

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

      const runner = disposable.track(
        new Runner({} as Config, 'echo', {
          completedEventEmitter,
          outputEventEmitter,
          startedEventEmitter
        })
      )

      runner.run(cwd, text)

      await started
      expect((await eventStream).includes(text)).to.be.true
      return completed
    }).timeout(12000)
  })
})
