import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { window, commands, QuickPickItem, Uri } from 'vscode'
import { buildMultiRepoExperiments, buildSingleRepoExperiments } from './util'
import { Disposable } from '../../../extension'
import { CliReader } from '../../../cli/reader'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import * as QuickPick from '../../../vscode/quickPick'
import { CliExecutor } from '../../../cli/executor'
import { closeAllEditors, mockDuration } from '../util'
import { dvcDemoPath } from '../../util'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../commands/external'
import * as Telemetry from '../../../telemetry'
import { CliRunner } from '../../../cli/runner'
import { join } from '../../util/path'

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
    }).timeout(8000)

    it('should not prompt to pick a project if there is only one project', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { workspaceExperiments } = buildSingleRepoExperiments(disposable)
      await workspaceExperiments.isReady()

      await workspaceExperiments.showWebview()

      expect(mockQuickPickOne).to.not.be.called
    })
  }).timeout(8000)

  describe('dvc.queueExperimentsFromCsv', () => {
    it('should be able to queue multiple experiments from a csv', async () => {
      const mockExperimentRunQueue = stub(
        CliExecutor.prototype,
        'experimentRunQueue'
      ).resolves('true')

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      const mockUri = Uri.file(join(dvcDemoPath, 'queue.csv'))

      stub(window, 'showOpenDialog').resolves([mockUri])

      await commands.executeCommand(
        RegisteredCommands.QUEUE_EXPERIMENTS_FROM_CSV
      )

      expect(mockExperimentRunQueue).to.be.calledThrice
      expect(mockExperimentRunQueue).to.be.calledWith(
        dvcDemoPath,
        '-S',
        'lr=0.0001',
        '-S',
        'weight_decay=0.02'
      )
      expect(mockExperimentRunQueue).to.be.calledWith(
        dvcDemoPath,
        '-S',
        'lr=0.00075',
        '-S',
        'weight_decay=0.01'
      )
      expect(mockExperimentRunQueue).to.be.calledWith(
        dvcDemoPath,
        '-S',
        'lr=0.0005'
      )
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
      const duration = 54321
      mockDuration(duration)

      stub(CliExecutor.prototype, 'experimentRunQueue').resolves('true')

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      const queueExperiment = commands.executeCommand(
        RegisteredCliCommands.QUEUE_EXPERIMENT
      )

      await queueExperiment

      expect(mockSendTelemetryEvent).to.be.calledWith(
        RegisteredCliCommands.QUEUE_EXPERIMENT,
        undefined,
        { duration }
      )
    })

    it('should send a telemetry event containing an error message when an experiment fails to queue', async () => {
      const duration = 77777
      mockDuration(duration)

      const mockErrorMessage =
        'ERROR: unexpected error - [Errno 2] No such file or directory'

      const mockGenericError = stub(window, 'showErrorMessage').resolves(
        undefined
      )

      stub(CliExecutor.prototype, 'experimentRunQueue').callsFake(() => {
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
    })
  })

  describe('dvc.runExperiment', () => {
    it('should be able to run an experiment', async () => {
      const mockRunExperiment = stub(
        CliRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_RUN)

      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.runResetExperiment', () => {
    it('should be able to reset existing checkpoints and restart the experiment', async () => {
      const mockRunExperimentReset = stub(
        CliRunner.prototype,
        'runExperimentReset'
      ).resolves(undefined)

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_RUN_RESET)

      expect(mockRunExperimentReset).to.be.calledOnce
      expect(mockRunExperimentReset).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.runQueuedExperiments', () => {
    it('should be able to execute all experiments in the run queue', async () => {
      const mockRunExperimentQueue = stub(
        CliRunner.prototype,
        'runExperimentQueue'
      ).resolves(undefined)

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_RUN_QUEUED)

      expect(mockRunExperimentQueue).to.be.calledOnce
      expect(mockRunExperimentQueue).to.be.calledWith(dvcDemoPath)
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
