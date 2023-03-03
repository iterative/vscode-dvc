import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { window, Event } from 'vscode'
import { Disposable, Disposer } from '../../../../extension'
import { Config } from '../../../../config'
import { DvcRunner } from '../../../../cli/dvc/runner'
import { CliResult, CliStarted } from '../../../../cli'
import { WEBVIEW_TEST_TIMEOUT } from '../../timeouts'
import { spyOnPrivateMemberMethod } from '../../util'
import * as ProcessExecution from '../../../../process/execution'
import { dvcDemoPath } from '../../../util'

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
      const mockConfig = {
        getCliPath: () => 'sleep',
        getPythonBinPath: () => undefined,
        sendLiveToStudio: () => false
      } as Config
      const mockGetStudioAccessToken = () => Promise.resolve(undefined)

      const dvcRunner = disposable.track(
        new DvcRunner(mockConfig, mockGetStudioAccessToken)
      )

      const windowErrorMessageSpy = spy(window, 'showErrorMessage')
      const cwd = __dirname

      await dvcRunner.run(cwd, '3')
      await dvcRunner.run(cwd, '1000')

      expect(windowErrorMessageSpy).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to stop a started command', async () => {
      const mockConfig = {
        getCliPath: () => 'sleep',
        getPythonBinPath: () => undefined,
        sendLiveToStudio: () => false
      } as Config
      const mockGetStudioAccessToken = () => Promise.resolve(undefined)

      const dvcRunner = disposable.track(
        new DvcRunner(mockConfig, mockGetStudioAccessToken)
      )
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

      const cwd = __dirname

      const mockConfig = {
        getCliPath: () => 'echo',
        getPythonBinPath: () => undefined,
        sendLiveToStudio: () => false
      } as Config
      const mockGetStudioAccessToken = () => Promise.resolve(undefined)

      const dvcRunner = disposable.track(
        new DvcRunner(mockConfig, mockGetStudioAccessToken)
      )

      const started = onDidStartOrCompleteProcess(dvcRunner.onDidStartProcess)
      const completed = onDidStartOrCompleteProcess(
        dvcRunner.onDidCompleteProcess
      )
      const eventStream = onDidOutputProcess(
        text,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dvcRunner as any).processOutput.event,
        disposable
      )

      void dvcRunner.run(cwd, text)

      const [, output] = await Promise.all([started, eventStream])

      expect(output.includes(text)).to.be.true
      return completed
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should add STUDIO_TOKEN to the environment if sendLiveToStudio is true and a studio access token is present', async () => {
      const mockCreateProcess = stub(ProcessExecution, 'createProcess').returns(
        {
          dispose: () => undefined,
          on: stub()
        } as unknown as ProcessExecution.Process
      )
      const mockStudioAccessToken = 'isat_ASASDDVSBVSDVCACAS'

      const mockConfig = {
        getCliPath: () => 'echo',
        getPythonBinPath: () => undefined,
        sendLiveToStudio: () => true
      } as Config
      const mockGetStudioAccessToken = stub()
        .onFirstCall()
        .resolves(mockStudioAccessToken)
        .onSecondCall()
        .resolves(undefined)

      const dvcRunner = disposable.track(
        new DvcRunner(mockConfig, mockGetStudioAccessToken)
      )

      await dvcRunner.runExperiment(dvcDemoPath)

      expect(mockCreateProcess).to.be.calledWithMatch({
        env: { STUDIO_TOKEN: mockStudioAccessToken }
      })

      mockCreateProcess.resetHistory()

      await dvcRunner.runExperiment(dvcDemoPath)

      expect(mockCreateProcess).not.to.be.calledWithMatch({
        env: { STUDIO_TOKEN: mockStudioAccessToken }
      })
    })
  })
})
