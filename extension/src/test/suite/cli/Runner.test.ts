import { describe, it, suite } from 'mocha'
import chai from 'chai'
import { spy, stub } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, Event, EventEmitter } from 'vscode'
import * as Execution from '../../../cli/execution'
import { Command } from '../../../cli/args'
import { Disposable, Disposer } from '../../../extension'
import { Config } from '../../../Config'
import { Runner } from '../../../cli/Runner'

chai.use(sinonChai)
const { expect } = chai

suite('Runner Test Suite', () => {
  window.showInformationMessage('Start all runner tests.')

  describe('Runner', () => {
    it('should only be able to run a single command at a time', async () => {
      const disposable = Disposable.fn()
      const runner = disposable.track(new Runner({} as Config))

      const windowErrorMessageSpy = spy(window, 'showErrorMessage')
      const cwd = __dirname
      const stubbedGetExecutionDetails = stub(
        Execution,
        'getExecutionDetails'
      ).returns({
        executable: 'sleep',
        cwd,
        env: {}
      })

      await runner.run(cwd, '3')
      await runner.run(cwd, Command.CHECKOUT)

      expect(windowErrorMessageSpy).to.be.calledOnce
      stubbedGetExecutionDetails.restore()
      disposable.dispose()
    }).timeout(6000)

    it('should be able to stop a started command', async () => {
      const disposable = Disposable.fn()
      const runner = disposable.track(new Runner({} as Config))
      const cwd = __dirname

      const executeCommandSpy = spy(commands, 'executeCommand')

      const processCompletedEvent = (): Promise<void> =>
        new Promise(resolve =>
          disposable.track(runner.onDidComplete(() => resolve()))
        )

      const stubbedGetExecutionDetails = stub(
        Execution,
        'getExecutionDetails'
      ).returns({
        executable: 'sleep',
        cwd,
        env: {}
      })

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

      stubbedGetExecutionDetails.restore()
      executeCommandSpy.restore()
      disposable.dispose()
    })

    it('should be able to execute a command and provide the correct events in the correct order', async () => {
      const disposable = Disposable.fn()

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

      const stubbedGetExecutionDetails = stub(
        Execution,
        'getExecutionDetails'
      ).returns({ executable: 'echo', cwd, env: {} })

      const runner = disposable.track(
        new Runner({} as Config, {
          completedEventEmitter,
          outputEventEmitter,
          startedEventEmitter
        })
      )

      runner.run(cwd, text)

      await started
      expect((await eventStream).includes(text)).to.be.true
      await completed

      stubbedGetExecutionDetails.restore()

      disposable.dispose()
    }).timeout(12000)
  })
})
