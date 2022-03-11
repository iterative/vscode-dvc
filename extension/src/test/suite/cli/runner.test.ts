import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { window, commands, Event, EventEmitter } from 'vscode'
import { Disposable, Disposer } from '../../../extension'
import { Config } from '../../../config'
import { CliRunner } from '../../../cli/runner'
import { CliResult, CliStarted } from '../../../cli'
import * as Telemetry from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'

suite('CLI Runner Test Suite', () => {
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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

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

      expect(cliRunner.isExperimentRunning()).to.be.true
      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.runner.running',
        true
      )

      const stopped = await cliRunner.stop()
      expect(stopped).to.be.true

      await completed

      expect(cliRunner.isExperimentRunning()).to.be.false
      expect(executeCommandSpy).to.be.calledWith(
        'setContext',
        'dvc.runner.running',
        false
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to execute a command and provide the correct events in the correct order', async () => {
      const text = ':weeeee:'

      const processCompleted = disposable.track(new EventEmitter<CliResult>())
      const processOutput = disposable.track(new EventEmitter<string>())
      const processStarted = disposable.track(new EventEmitter<CliStarted>())

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
        event: Event<CliResult | CliStarted>
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

      const [, output] = await Promise.all([started, eventStream])

      expect(output.includes(text)).to.be.true
      return completed
    })

    it('should send an error event if the command fails with an exit code and stderr', async () => {
      const mockSendTelemetryEvent = stub(Telemetry, 'sendErrorTelemetryEvent')

      const cliRunner = disposable.track(new CliRunner({} as Config, 'sleep'))

      const cwd = __dirname

      await cliRunner.run(cwd, '1', '&&', 'then', 'die')
      const process = cliRunner.getRunningProcess()

      const processCompleted = new Promise(resolve =>
        process?.on('close', () => resolve(undefined))
      )

      await expect(process).to.eventually.be.rejectedWith(Error)

      await processCompleted

      const [eventName, error, , properties] =
        mockSendTelemetryEvent.getCall(0).args

      const { command, exitCode } = properties as {
        command: string
        exitCode?: number | undefined
      }

      expect(eventName).to.equal(EventName.EXPERIMENTS_RUNNER_COMPLETED)
      expect(error.message).to.have.length.greaterThan(0)
      expect(command).to.equal('sleep 1 && then die')
      expect(exitCode).to.be.greaterThan(0)
    }).timeout(6000)
  })
})
