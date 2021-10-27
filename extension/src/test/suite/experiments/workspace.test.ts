import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, useFakeTimers } from 'sinon'
import { window, commands, workspace, Uri, QuickPickItem } from 'vscode'
import { buildMultiRepoExperiments, buildSingleRepoExperiments } from './util'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import complexExperimentsOutput from '../../fixtures/complex-output-example'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Config } from '../../../config'
import * as Git from '../../../git'
import { ResourceLocator } from '../../../resourceLocator'
import * as QuickPick from '../../../vscode/quickPick'
import { CliRunner } from '../../../cli/runner'
import { AvailableCommands, InternalCommands } from '../../../commands/internal'
import { CliExecutor } from '../../../cli/executor'
import { closeAllEditors, dvcDemoPath, resourcePath } from '../util'
import { buildMockMemento } from '../../util'
import { RegisteredCliCommands } from '../../../commands/external'
import * as Telemetry from '../../../telemetry'
import { OutputChannel } from '../../../vscode/outputChannel'

suite('Workspace Experiments Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return closeAllEditors()
  })

  const onDidChangeIsWebviewFocused = (
    experiments: Experiments
  ): Promise<string | undefined> =>
    new Promise(resolve => {
      const listener: Disposable = experiments.onDidChangeIsWebviewFocused(
        (event: string | undefined) => {
          listener.dispose()
          return resolve(event)
        }
      )
    })

  describe('showExperimentsTable', () => {
    it('should prompt to pick a project even if a webview is focused', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { workspaceExperiments, experiments } =
        buildMultiRepoExperiments(disposable)

      await workspaceExperiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experiments)

      await workspaceExperiments.showWebview()

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(workspaceExperiments.getFocusedWebview()).to.equal(experiments)

      mockQuickPickOne.resetHistory()

      const focusedExperiments = await workspaceExperiments.showWebview()

      expect(focusedExperiments).to.equal(experiments)
      expect(mockQuickPickOne).to.be.calledOnce
    }).timeout(5000)

    it('should not prompt to pick a project if there is only one project', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { workspaceExperiments } = buildSingleRepoExperiments(disposable)
      await workspaceExperiments.isReady()

      await workspaceExperiments.showWebview()

      expect(mockQuickPickOne).to.not.be.called
    })
  })

  describe('showExperimentsTableThenRun', () => {
    it('should run against an experiments table if webview is focused', async () => {
      stub(Git, 'getGitRepositoryRoot').resolves(dvcDemoPath)
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
      const mockExperiments = {
        'other/dvc/root': { cliReader } as unknown as Experiments
      } as Record<string, Experiments>

      const workspaceExperiments = disposable.track(
        new WorkspaceExperiments(
          internalCommands,
          buildMockMemento(),
          mockExperiments
        )
      )
      const [experiments] = workspaceExperiments.create(
        [dvcDemoPath],
        resourceLocator
      )

      experiments.setState(complexExperimentsOutput)
      await workspaceExperiments.isReady()

      const focused = onDidChangeIsWebviewFocused(experiments)

      await workspaceExperiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_QUEUED
      )

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(mockRun).to.be.calledWith(dvcDemoPath, 'exp', 'run', '--run-all')
      expect(workspaceExperiments.getFocusedWebview()).to.equal(experiments)

      mockQuickPickOne.resetHistory()

      const focusedExperiments =
        await workspaceExperiments.showExperimentsTableThenRun(
          AvailableCommands.EXPERIMENT_RUN_QUEUED
        )

      expect(focusedExperiments).to.equal(experiments)
      expect(mockQuickPickOne).not.to.be.called

      const unfocused = onDidChangeIsWebviewFocused(experiments)
      const uri = Uri.file(resolve(dvcDemoPath, 'params.yaml'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(await unfocused).to.be.undefined
      expect(workspaceExperiments.getFocusedWebview()).to.be.undefined

      const focusedAgain = onDidChangeIsWebviewFocused(experiments)
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

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.QUEUE_EXPERIMENT)

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

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.QUEUE_EXPERIMENT)

      expect(mockSendTelemetryEvent).to.be.calledWith(
        RegisteredCliCommands.QUEUE_EXPERIMENT,
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

      const mockGenericError = stub(window, 'showErrorMessage').resolves(
        undefined
      )

      stub(CliExecutor.prototype, 'experimentRunQueue').callsFake(() => {
        clock.tick(duration)
        throw new Error(mockErrorMessage)
      })

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.QUEUE_EXPERIMENT)

      expect(mockSendTelemetryEvent).to.be.calledWith(
        `errors.${RegisteredCliCommands.QUEUE_EXPERIMENT}`,
        { error: mockErrorMessage },
        { duration }
      )
      expect(mockGenericError, 'the generic error should be shown').to.be
        .calledOnce

      clock.restore()
    })
  })

  describe('dvc.applyExperiment', () => {
    it('should ask the user to pick an experiment and then apply that experiment to the workspace', async () => {
      const mockExperiment = 'exp-to-apply'

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)
      stub(CliReader.prototype, 'experimentListCurrent').resolves([
        mockExperiment
      ])

      stub(window, 'showQuickPick').resolves(
        mockExperiment as unknown as QuickPickItem
      )
      const mockExperimentApply = stub(CliExecutor.prototype, 'experimentApply')

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_APPLY)

      expect(mockExperimentApply).to.be.calledWith(dvcDemoPath, mockExperiment)
    })
  })

  describe('dvc.removeExperiment', () => {
    it('should ask the user to pick an experiment and then remove that experiment from the workspace', async () => {
      const mockExperiment = 'exp-to-remove'

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)
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

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_REMOVE)

      expect(mockExperimentRemove).to.be.calledWith(dvcDemoPath, mockExperiment)
    })
  })
})
