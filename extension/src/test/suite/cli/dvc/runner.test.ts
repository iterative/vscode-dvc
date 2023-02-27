import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy } from 'sinon'
import { window, Event, EventEmitter } from 'vscode'
import { Disposable, Disposer } from '../../../../extension'
import { Config } from '../../../../config'
import { DvcRunner } from '../../../../cli/dvc/runner'
import { CliResult, CliStarted } from '../../../../cli'
import { WEBVIEW_TEST_TIMEOUT } from '../../timeouts'
import { spyOnPrivateMemberMethod } from '../../util'

suite('DVC Runner Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('DvcRunner', () => {
    it('should only be able to run a single command at a time', async () => {
      const mockConfig = { getPythonBinPath: () => undefined } as Config
      const dvcRunner = disposable.track(new DvcRunner(mockConfig, 'sleep'))

      const windowErrorMessageSpy = spy(window, 'showErrorMessage')
      const cwd = __dirname

      await dvcRunner.run(cwd, '3')
      await dvcRunner.run(cwd, '1000')

      expect(windowErrorMessageSpy).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to stop a started command', async () => {
      const mockConfig = { getPythonBinPath: () => undefined } as Config
      const dvcRunner = disposable.track(new DvcRunner(mockConfig, 'sleep'))
      const cwd = __dirname

      const onDidCompleteProcess = (): Promise<void> =>
        new Promise(resolve =>
          disposable.track(dvcRunner.onDidCompleteProcess(() => resolve()))
        )

      await dvcRunner.run(cwd, '100000000000000000000000')

      const completed = onDidCompleteProcess()

      expect(dvcRunner.isExperimentRunning()).to.be.true

      const closeSpy = spyOnPrivateMemberMethod(
        dvcRunner,
        'pseudoTerminal',
        'close'
      )

      await dvcRunner.stop()
      expect(closeSpy).to.be.calledOnce

      await completed

      expect(dvcRunner.isExperimentRunning()).to.be.false
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

      const mockConfig = { getPythonBinPath: () => undefined } as Config
      const dvcRunner = disposable.track(
        new DvcRunner(mockConfig, 'echo', {
          processCompleted,
          processOutput,
          processStarted
        })
      )

      void dvcRunner.run(cwd, text)

      const [, output] = await Promise.all([started, eventStream])

      expect(output.includes(text)).to.be.true
      return completed
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })
})
