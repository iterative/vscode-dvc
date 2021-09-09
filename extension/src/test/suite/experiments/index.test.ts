import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, useFakeTimers } from 'sinon'
import { window, commands, workspace, Uri, QuickPickItem } from 'vscode'
import { buildMultiRepoExperiments, buildSingleRepoExperiments } from './util'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import complexExperimentsOutput from '../../fixtures/complex-output-example'
import { Experiments } from '../../../experiments'
import { ExperimentsRepository } from '../../../experiments/repository'
import { Config } from '../../../config'
import { ResourceLocator } from '../../../resourceLocator'
import * as QuickPick from '../../../vscode/quickPick'
import { setConfigValue } from '../../../vscode/config'
import { CliRunner } from '../../../cli/runner'
import { AvailableCommands, InternalCommands } from '../../../commands/internal'
import { CliExecutor } from '../../../cli/executor'
import { dvcDemoPath, resourcePath } from '../util'
import { buildMockMemento } from '../../util'
import { RegisteredCommands } from '../../../commands/external'
import * as Telemetry from '../../../telemetry'
import { OutputChannel } from '../../../vscode/outputChannel'

suite('Experiments Test Suite', () => {
  window.showInformationMessage('Start all experiments tests.')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
    return setConfigValue('dvc.defaultProject', undefined)
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  const onDidChangeIsWebviewFocused = (
    experimentsRepository: ExperimentsRepository
  ): Promise<string | undefined> =>
    new Promise(resolve => {
      const listener: Disposable =
        experimentsRepository.onDidChangeIsWebviewFocused(
          (event: string | undefined) => {
            listener.dispose()
            return resolve(event)
          }
        )
    })

  describe('showExperimentsTable', () => {
    it("should take the config's default even if an experiments webview is focused", async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne')

      await setConfigValue('dvc.defaultProject', dvcDemoPath)

      const { configSpy, experiments, experimentsRepository } =
        buildMultiRepoExperiments(disposable)

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsRepository)

      await experiments.showExperimentsTable()

      expect(await focused).to.equal(dvcDemoPath)
      expect(configSpy).to.be.calledOnce
      expect(mockQuickPickOne).not.to.be.called
      expect(experiments.getFocusedTable()).to.equal(experimentsRepository)

      configSpy.resetHistory()
      mockQuickPickOne.resetHistory()

      const focusedExperimentsRepository =
        await experiments.showExperimentsTable()

      expect(focusedExperimentsRepository).to.equal(experimentsRepository)
      expect(mockQuickPickOne).not.to.be.called
      expect(configSpy).to.be.calledOnce
    }).timeout(5000)

    it('should prompt to pick a project even if a webview is focused (if no default)', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { experiments, experimentsRepository } =
        buildMultiRepoExperiments(disposable)

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsRepository)

      await experiments.showExperimentsTable()

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(experiments.getFocusedTable()).to.equal(experimentsRepository)

      mockQuickPickOne.resetHistory()

      const focusedExperimentsRepository =
        await experiments.showExperimentsTable()

      expect(focusedExperimentsRepository).to.equal(experimentsRepository)
      expect(mockQuickPickOne).to.be.calledOnce
    }).timeout(5000)

    it('should not prompt to pick a project if there is only one project', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { experiments } = buildSingleRepoExperiments(disposable)
      await experiments.isReady()

      await experiments.showExperimentsTable()

      expect(mockQuickPickOne).to.not.be.called
    })
  })

  describe('showExperimentsTableThenRun', () => {
    it('should run against an experiments table if webview is focused', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const config = disposable.track(new Config())
      const cliReader = disposable.track(new CliReader(config))
      stub(cliReader, 'experimentShow').resolves(complexExperimentsOutput)
      const cliRunner = disposable.track(new CliRunner(config))
      const mockRun = stub(cliRunner, 'run').resolves()
      const outputChannel = disposable.track(
        new OutputChannel([cliReader], '5', 'experiments runner test')
      )

      const internalCommands = disposable.track(
        new InternalCommands(config, outputChannel, cliReader, cliRunner)
      )

      const resourceLocator = disposable.track(
        new ResourceLocator(Uri.file(resourcePath))
      )
      const mockExperimentsRepository = {
        'other/dvc/root': { cliReader } as unknown as ExperimentsRepository
      } as Record<string, ExperimentsRepository>

      const experiments = disposable.track(
        new Experiments(
          internalCommands,
          buildMockMemento(),
          mockExperimentsRepository
        )
      )
      const [experimentsRepository] = experiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      await experiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experimentsRepository)

      await experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_QUEUED
      )

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(mockRun).to.be.calledWith(dvcDemoPath, 'exp', 'run', '--run-all')
      expect(experiments.getFocusedTable()).to.equal(experimentsRepository)

      mockQuickPickOne.resetHistory()

      const focusedExperimentsRepository =
        await experiments.showExperimentsTableThenRun(
          AvailableCommands.EXPERIMENT_RUN_QUEUED
        )

      expect(focusedExperimentsRepository).to.equal(experimentsRepository)
      expect(mockQuickPickOne).not.to.be.called

      const unfocused = onDidChangeIsWebviewFocused(experimentsRepository)
      const uri = Uri.file(resolve(dvcDemoPath, 'params.yaml'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(await unfocused).to.be.undefined
      expect(experiments.getFocusedTable()).to.be.undefined

      const focusedAgain = onDidChangeIsWebviewFocused(experimentsRepository)
      await commands.executeCommand('workbench.action.previousEditor')
      expect(await focusedAgain).to.equal(dvcDemoPath)
    })
  })

  describe('dvc.queueExperiment', () => {
    it('should be able to queue an experiment', async () => {
      const mockExperimentRunQueue = stub(
        CliExecutor.prototype,
        'experimentRunQueue'
      ).resolves('true')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getDefaultOrPickProject').returns(
        dvcDemoPath
      )

      await commands.executeCommand(RegisteredCommands.QUEUE_EXPERIMENT)

      expect(mockExperimentRunQueue).to.be.calledOnce
      expect(mockExperimentRunQueue).to.be.calledWith(dvcDemoPath)
    })

    it('should send a telemetry event containing a duration when an experiment is queued', async () => {
      const clock = useFakeTimers()
      const duration = 54321

      stub(CliExecutor.prototype, 'experimentRunQueue').callsFake(() => {
        clock.tick(duration)
        return Promise.resolve('true')
      })

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getDefaultOrPickProject').returns(
        dvcDemoPath
      )

      await commands.executeCommand(RegisteredCommands.QUEUE_EXPERIMENT)

      expect(mockSendTelemetryEvent).to.be.calledWith(
        RegisteredCommands.QUEUE_EXPERIMENT,
        undefined,
        { duration }
      )

      clock.restore()
    })

    it('should send a telemetry event containing an error message when an experiment fails to queue', async () => {
      const clock = useFakeTimers()
      const duration = 77777
      const mockErrorMessage =
        'ERROR: unexpected error - [Errno 2] No such file or directory'

      stub(CliExecutor.prototype, 'experimentRunQueue').callsFake(() => {
        clock.tick(duration)
        throw new Error(mockErrorMessage)
      })

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getDefaultOrPickProject').returns(
        dvcDemoPath
      )

      await expect(
        commands.executeCommand(RegisteredCommands.QUEUE_EXPERIMENT)
      ).to.eventually.be.rejectedWith(Error)

      expect(mockSendTelemetryEvent).to.be.calledWith(
        `errors.${RegisteredCommands.QUEUE_EXPERIMENT}`,
        { error: mockErrorMessage },
        { duration }
      )

      clock.restore()
    })
  })

  describe('dvc.applyExperiment', () => {
    it('should ask the user to pick an experiment and then apply that experiment to the workspace', async () => {
      const mockExperiment = 'exp-to-apply'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getDefaultOrPickProject').returns(
        dvcDemoPath
      )
      stub(CliReader.prototype, 'experimentListCurrent').resolves([
        mockExperiment
      ])

      stub(window, 'showQuickPick').resolves(
        mockExperiment as unknown as QuickPickItem
      )
      const mockExperimentApply = stub(CliExecutor.prototype, 'experimentApply')

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_APPLY)

      expect(mockExperimentApply).to.be.calledWith(dvcDemoPath, mockExperiment)
    })
  })

  describe('dvc.removeExperiment', () => {
    it('should ask the user to pick an experiment and then remove that experiment from the workspace', async () => {
      const mockExperiment = 'exp-to-remove'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getDefaultOrPickProject').returns(
        dvcDemoPath
      )
      stub(CliReader.prototype, 'experimentListCurrent').resolves([
        'exp-afc12',
        mockExperiment,
        'exp-bcde2',
        'exp-ghi1k'
      ])
      stub(window, 'showQuickPick').resolves(
        mockExperiment as unknown as QuickPickItem
      )
      const mockExperimentRemove = stub(
        CliExecutor.prototype,
        'experimentRemove'
      )

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_REMOVE)

      expect(mockExperimentRemove).to.be.calledWith(dvcDemoPath, mockExperiment)
    })
  })
})
