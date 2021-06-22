import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { restore, spy, stub } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, Event, EventEmitter } from 'vscode'
import { Disposable, Disposer } from '../../../extension'
import { Config } from '../../../config'
import { CliRunner } from '../../../cli/runner'
import * as ProcessExecution from '../../../processExecution'
import { Command } from '../../../cli/args'
import { CliResult } from '../../../cli'

chai.use(sinonChai)
const { expect } = chai

suite('Runner Test Suite', () => {
  window.showInformationMessage('Start all cli runner tests.')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('CliRunner', () => {
    it('should only be able to run a single command at a time', async () => {
      const cliRunner = disposable.track(new CliRunner({} as Config, 'sleep'))

      const windowErrorMessageSpy = spy(window, 'showErrorMessage')
      const cwd = __dirname

      await cliRunner.run(cwd, '3')
      await cliRunner.run(cwd, '1000')

      expect(windowErrorMessageSpy).to.be.calledOnce
    }).timeout(6000)

    it('should be able to stop a started command', async () => {
      const cliRunner = disposable.track(new CliRunner({} as Config, 'sleep'))
      const cwd = __dirname

      const executeCommandSpy = spy(commands, 'executeCommand')

      const onDidCompleteProcess = (): Promise<void> =>
        new Promise(resolve =>
          disposable.track(cliRunner.onDidCompleteProcess(() => resolve()))
        )

      await cliRunner.run(cwd, '100000000000000000000000')

      const completed = onDidCompleteProcess()

      expect(cliRunner.isRunning()).to.be.true
      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.runner.running',
        true
      )

      const stopped = await cliRunner.stop()
      expect(stopped).to.be.true

      await completed

      expect(cliRunner.isRunning()).to.be.false
      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.runner.running',
        false
      )
    })

    it('should be able to execute a command and provide the correct events in the correct order', async () => {
      const text = ':weeeee:'

      const processCompleted = disposable.track(new EventEmitter<CliResult>())
      const processOutput = disposable.track(new EventEmitter<string>())
      const processStarted = disposable.track(new EventEmitter<void>())

      const onDidOutputProcess = (
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
      const onDidStartOrCompleteProcess = (
        event: Event<CliResult | void>
      ): Promise<void> => {
        return new Promise(resolve => {
          const listener: Disposable = event(() => {
            listener.dispose()
            return resolve()
          })
        })
      }
      const started = onDidStartOrCompleteProcess(processStarted.event)
      const completed = onDidStartOrCompleteProcess(processCompleted.event)
      const eventStream = onDidOutputProcess(
        text,
        processOutput.event,
        disposable
      )

      const cwd = __dirname

      const cliRunner = disposable.track(
        new CliRunner({} as Config, 'echo', {
          processCompleted: processCompleted,
          processOutput: processOutput,
          processStarted: processStarted
        })
      )

      cliRunner.run(cwd, text)

      await started
      expect((await eventStream).includes(text)).to.be.true
      return completed
    }).timeout(12000)

    it('should call createProcess with the correct arguments when no executable is provided', async () => {
      const mockCreateProcess = stub(ProcessExecution, 'createProcess').returns(
        { on: spy() } as unknown as ProcessExecution.Process
      )
      const cwd = __dirname

      const cliRunner = disposable.track(
        new CliRunner({ getCliPath: () => undefined } as unknown as Config)
      )

      await cliRunner.run(cwd, Command.ADD)
      expect(mockCreateProcess).to.have.been.calledOnce
      expect(mockCreateProcess).to.have.been.calledWith({
        args: [Command.ADD],
        cwd,
        env: process.env,
        executable: 'dvc'
      })
    })
  })
})
