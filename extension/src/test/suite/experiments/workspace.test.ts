import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, SinonStub } from 'sinon'
import { window, commands, QuickPickItem, QuickPickOptions } from 'vscode'
import {
  buildExperiments,
  buildMultiRepoExperiments,
  buildSingleRepoExperiments
} from './util'
import { Disposable } from '../../../extension'
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
import { Param } from '../../../experiments/model/queue/collect'
import { QuickPickItemWithValue } from '../../../vscode/quickPick'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should not prompt to pick a project if there is only one project', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { workspaceExperiments } = buildSingleRepoExperiments(disposable)
      await workspaceExperiments.isReady()

      await workspaceExperiments.showWebview()

      expect(mockQuickPickOne).to.not.be.called
    })
  }).timeout(WEBVIEW_TEST_TIMEOUT)

  describe('dvc.queueExperimentsFromExisting', () => {
    it('should be able to queue an experiment using an existing one as a base', async () => {
      const { experiments } = buildExperiments(disposable)

      const mockExperimentRunQueue = stub(
        CliExecutor.prototype,
        'experimentRunQueue'
      ).resolves('true')

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptions],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: 'workspace' } as QuickPickItemWithValue)
        .onSecondCall()
        .resolves([
          {
            label: 'params.yaml:dropout',
            value: { path: 'params.yaml:dropout', value: 0.122 }
          },
          {
            label: 'params.yaml:process.threshold',
            value: { path: 'params.yaml:process.threshold', value: 0.86 }
          }
        ] as QuickPickItemWithValue<Param>[])

      stub(window, 'showInputBox')
        .onFirstCall()
        .resolves('0.15')
        .onSecondCall()
        .resolves('0.16')

      await commands.executeCommand(
        RegisteredCommands.QUEUE_EXPERIMENT_FROM_EXISTING
      )

      expect(mockExperimentRunQueue).to.be.calledOnce
      expect(mockExperimentRunQueue).to.be.calledWith(
        dvcDemoPath,
        '-S',
        'params.yaml:dropout=0.15',
        '-S',
        'params.yaml:process.threshold=0.16'
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
      const selectedExperiment = 'test-branch'

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getRepository'
      ).returns(experiments)
      const mockShowQuickPick = stub(window, 'showQuickPick').resolves({
        value: { id: selectedExperiment, name: selectedExperiment }
      } as QuickPickItemWithValue<{ id: string; name: string }>)
      const mockExperimentApply = stub(CliExecutor.prototype, 'experimentApply')

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_APPLY)

      expect(mockExperimentApply).to.be.calledWith(
        dvcDemoPath,
        selectedExperiment
      )
      expect(mockShowQuickPick).to.be.calledWith(
        [
          {
            description: '[exp-e7a67]',
            label: '4fb124a',
            value: {
              id: 'exp-e7a67',
              name: 'exp-e7a67'
            }
          },
          {
            description: '[test-branch]',
            label: '42b8736',
            value: {
              id: 'test-branch',
              name: 'test-branch'
            }
          },
          {
            description: '[exp-83425]',
            label: '1ba7bcd',
            value: {
              id: 'exp-83425',
              name: 'exp-83425'
            }
          }
        ],
        {
          canPickMany: false,
          title: 'Select an experiment'
        }
      )
    })
  })

  describe('dvc.removeExperiment', () => {
    it('should ask the user to pick an experiment and then remove that experiment from the workspace', async () => {
      const mockExperiment = 'exp-to-remove'

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getRepository'
      ).returns(experiments)

      stub(window, 'showQuickPick').resolves({
        value: { id: mockExperiment, name: mockExperiment }
      } as QuickPickItemWithValue<{ id: string; name: string }>)
      const mockExperimentRemove = stub(
        CliExecutor.prototype,
        'experimentRemove'
      )

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_REMOVE)

      expect(mockExperimentRemove).to.be.calledWith(dvcDemoPath, mockExperiment)
    })
  })
})
