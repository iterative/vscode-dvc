import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, SinonStub, match } from 'sinon'
import { window, commands, QuickPickItem, Uri } from 'vscode'
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
import { closeAllEditors, getInputBoxEvent, mockDuration } from '../util'
import { dvcDemoPath } from '../../util'
import { RegisteredCliCommands } from '../../../commands/external'
import * as Telemetry from '../../../telemetry'
import { CliRunner } from '../../../cli/runner'
import { Param } from '../../../experiments/model/modify/collect'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../vscode/quickPick'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { Title } from '../../../vscode/title'
import { join } from '../../util/path'
import { AvailableCommands } from '../../../commands/internal'
import * as Git from '../../../git'

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

  describe('project focus', () => {
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

    it('should not prompt to pick a project if a params file is focused', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { workspaceExperiments, experiments, internalCommands } =
        buildMultiRepoExperiments(disposable)

      await workspaceExperiments.isReady()

      const focusedWebview = onDidChangeIsWebviewFocused(experiments)

      await workspaceExperiments.showWebview()

      expect(await focusedWebview).to.equal(dvcDemoPath)

      const focusedParamsFile = new Promise(resolve => {
        const listener: Disposable = experiments.onDidChangeIsParamsFileFocused(
          (event: string | undefined) => {
            listener.dispose()
            return resolve(event)
          }
        )
      })

      const paramsFile = Uri.file(join(dvcDemoPath, 'params.yaml'))
      await window.showTextDocument(paramsFile)

      expect(await focusedParamsFile).to.equal(dvcDemoPath)

      mockQuickPickOne.resetHistory()

      const mockExecuteCommand = stub(
        internalCommands,
        'executeCommand'
      ).resolves(undefined)

      await workspaceExperiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN)

      expect(mockQuickPickOne).not.to.be.calledOnce
      expect(mockExecuteCommand).to.be.calledWith(
        AvailableCommands.EXPERIMENT_RUN,
        dvcDemoPath
      )
    })
  }).timeout(WEBVIEW_TEST_TIMEOUT)

  describe('dvc.modifyExperimentParamsAndQueue', () => {
    it('should be able to queue an experiment using an existing one as a base', async () => {
      const { cliExecutor, experiments } = buildExperiments(disposable)

      const mockExperimentRunQueue = stub(
        cliExecutor,
        'experimentRunQueue'
      ).resolves('true')

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<
          QuickPickItem[] | QuickPickItemWithValue<{ id: string }> | undefined
        >
      >
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: { id: 'workspace' } } as QuickPickItemWithValue<{
          id: string
        }>)
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
        RegisteredCliCommands.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE
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

  describe('dvc.modifyExperimentParamsAndResume', () => {
    it('should be able to resume a checkpoint experiment using an existing one as a base', async () => {
      const { experiments } = buildExperiments(disposable)

      const mockExperimentRun = stub(
        CliRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<
          QuickPickItem[] | QuickPickItemWithValue<{ id: string }> | undefined
        >
      >
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: { id: 'workspace' } } as QuickPickItemWithValue<{
          id: string
        }>)
        .onSecondCall()
        .resolves([
          {
            label: 'params.yaml:dropout',
            value: { path: 'params.yaml:dropout', value: 0.1 }
          },
          {
            label: 'params.yaml:process.threshold',
            value: { path: 'params.yaml:process.threshold', value: 0.15 }
          }
        ] as QuickPickItemWithValue<Param>[])

      const dropout = '0.222222'
      const threshold = '0.1665'

      stub(window, 'showInputBox')
        .onFirstCall()
        .resolves(dropout)
        .onSecondCall()
        .resolves(threshold)

      await commands.executeCommand(
        RegisteredCliCommands.MODIFY_EXPERIMENT_PARAMS_AND_RESUME
      )

      expect(mockExperimentRun).to.be.calledOnce
      expect(mockExperimentRun).to.be.calledWith(
        dvcDemoPath,
        '-S',
        `params.yaml:dropout=${dropout}`,
        '-S',
        `params.yaml:process.threshold=${threshold}`
      )
    })
  })

  describe('dvc.modifyExperimentParamsAndRun', () => {
    it('should be able to run an experiment using an existing one as a base', async () => {
      const { experiments } = buildExperiments(disposable)

      const mockExperimentRun = stub(
        CliRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<
          QuickPickItem[] | QuickPickItemWithValue<{ id: string }> | undefined
        >
      >
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: { id: 'workspace' } } as QuickPickItemWithValue<{
          id: string
        }>)
        .onSecondCall()
        .resolves([
          {
            label: 'params.yaml:dropout',
            value: { path: 'params.yaml:dropout', value: 0.1 }
          },
          {
            label: 'params.yaml:process.threshold',
            value: { path: 'params.yaml:process.threshold', value: 0.15 }
          }
        ] as QuickPickItemWithValue<Param>[])

      const dropout = '0.222222'
      const threshold = '0.1665'

      stub(window, 'showInputBox')
        .onFirstCall()
        .resolves(dropout)
        .onSecondCall()
        .resolves(threshold)

      await commands.executeCommand(
        RegisteredCliCommands.MODIFY_EXPERIMENT_PARAMS_AND_RUN
      )

      expect(mockExperimentRun).to.be.calledOnce
      expect(mockExperimentRun).to.be.calledWith(
        dvcDemoPath,
        '-S',
        `params.yaml:dropout=${dropout}`,
        '-S',
        `params.yaml:process.threshold=${threshold}`
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
        match.has('duration')
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

  describe('dvc.resumeCheckpointExperiment', () => {
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

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_RESUME)

      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.resetAndRunCheckpointExperiment', () => {
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

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_RESET_AND_RUN
      )

      expect(mockRunExperimentReset).to.be.calledOnce
      expect(mockRunExperimentReset).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.startExperimentsQueue', () => {
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
          },
          {
            description: undefined,
            label: '489fd8b',
            value: {
              id: '489fd8bdaa709f7330aac342e051a9431c625481',
              name: '489fd8b'
            }
          },
          {
            description: '[exp-f13bca]',
            label: 'f0f9186',
            value: { id: 'exp-f13bca', name: 'exp-f13bca' }
          }
        ],
        {
          canPickMany: false,
          title: Title.SELECT_EXPERIMENT
        }
      )
    })
  })

  describe('dvc.branchExperiment', () => {
    it('should be able to create a branch from an experiment', async () => {
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const testExperiment = 'exp-83425'
      const mockBranch = 'brunch'
      const inputEvent = getInputBoxEvent(mockBranch)

      stub(window, 'showQuickPick').resolves({
        value: { id: testExperiment, name: testExperiment }
      } as QuickPickItemWithValue<{ id: string; name: string }>)

      const mockExperimentBranch = stub(
        CliExecutor.prototype,
        'experimentBranch'
      ).resolves(
        `Git branch '${mockBranch}' has been created from experiment '${testExperiment}'.        
     To switch to the new branch run:
           git checkout ${mockBranch}`
      )

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_BRANCH)

      await inputEvent
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        testExperiment,
        mockBranch
      )
    })
  })

  describe('dvc.shareExperimentAsBranch', () => {
    it('should be able to share an experiment as a branch', async () => {
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const testExperiment = 'exp-83425'
      const mockBranch = 'more-brunch'
      const inputEvent = getInputBoxEvent(mockBranch)

      stub(window, 'showQuickPick').resolves({
        value: { id: testExperiment, name: testExperiment }
      } as QuickPickItemWithValue<{ id: string; name: string }>)

      const mockExperimentBranch = stub(
        CliExecutor.prototype,
        'experimentBranch'
      ).resolves(
        `Git branch '${mockBranch}' has been created from experiment '${testExperiment}'.
     To switch to the new branch run:
           git checkout ${mockBranch}`
      )
      const mockExperimentApply = stub(
        CliExecutor.prototype,
        'experimentApply'
      ).resolves(
        `Changes for experiment '${testExperiment}' have been applied to your current workspace.`
      )
      const mockPush = stub(CliExecutor.prototype, 'push').resolves(
        '10 files updated.'
      )
      const mockGitPush = stub(Git, 'gitPushBranch')
      const branchPushedToRemote = new Promise(resolve =>
        mockGitPush.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(`${mockBranch} pushed to remote`)
        })
      )

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      ).returns(dvcDemoPath)

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_SHARE_AS_BRANCH
      )

      await inputEvent
      await branchPushedToRemote
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        testExperiment,
        mockBranch
      )
      expect(mockExperimentApply).to.be.calledWithExactly(
        dvcDemoPath,
        testExperiment
      )
      expect(mockPush).to.be.calledWithExactly(dvcDemoPath)
      expect(mockGitPush).to.be.calledWithExactly(dvcDemoPath, mockBranch)
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

  describe('dvc.removeExperimentQueue', () => {
    it('should remove all queued experiments from the selected repository', async () => {
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

      const mockExperimentRemove = stub(
        CliExecutor.prototype,
        'experimentRemove'
      )

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_REMOVE_QUEUE
      )

      expect(mockExperimentRemove).to.be.calledWith(dvcDemoPath, '--queue')
    })
  })

  describe('dvc.removeQueuedExperiment', () => {
    it('should ask the user to pick a queued experiment and then remove that experiment from the workspace', async () => {
      const mockExperiment = 'queued-exp-to-remove'

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

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_REMOVE_QUEUED
      )

      expect(mockExperimentRemove).to.be.calledWith(dvcDemoPath, mockExperiment)
    })
  })
})
