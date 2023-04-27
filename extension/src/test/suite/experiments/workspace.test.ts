import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, SinonStub, match, spy } from 'sinon'
import { window, commands, QuickPickItem, Uri } from 'vscode'
import {
  buildExperiments,
  buildMultiRepoExperiments,
  buildSingleRepoExperiments,
  stubWorkspaceExperimentsGetters
} from './util'
import { Disposable } from '../../../extension'
import { Experiments } from '../../../experiments'
import * as QuickPick from '../../../vscode/quickPick'
import { DvcExecutor } from '../../../cli/dvc/executor'
import {
  closeAllEditors,
  getInputBoxEvent,
  getTimeSafeDisposer,
  mockDuration
} from '../util'
import { dvcDemoPath } from '../../util'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../commands/external'
import * as Telemetry from '../../../telemetry'
import { DvcRunner } from '../../../cli/dvc/runner'
import { Param } from '../../../experiments/model/modify/collect'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../vscode/quickPick'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { Title } from '../../../vscode/title'
import { join } from '../../util/path'
import { AvailableCommands } from '../../../commands/internal'
import { EXPERIMENT_WORKSPACE_ID } from '../../../cli/dvc/contract'
import { formatDate } from '../../../util/date'
import { DvcReader } from '../../../cli/dvc/reader'
import { Setup } from '../../../setup'
import { WorkspaceExperiments } from '../../../experiments/workspace'

suite('Workspace Experiments Test Suite', () => {
  const disposable = getTimeSafeDisposer()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    return Promise.all([closeAllEditors(), disposable.disposeAndFlush()])
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

      await workspaceExperiments.showWebview('')

      expect(await focused).to.equal(dvcDemoPath)
      expect(mockQuickPickOne).to.be.calledOnce
      expect(workspaceExperiments.getFocusedWebview()).to.equal(experiments)

      mockQuickPickOne.resetHistory()

      const focusedExperiments = await workspaceExperiments.showWebview('')

      expect(focusedExperiments).to.equal(experiments)
      expect(mockQuickPickOne).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should not prompt to pick a project if there is only one project', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { workspaceExperiments } = buildSingleRepoExperiments(disposable)
      await workspaceExperiments.isReady()

      await workspaceExperiments.showWebview('')

      expect(mockQuickPickOne).to.not.be.called
    })

    it('should not prompt to pick a project if a params file is focused', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      const { workspaceExperiments, experiments } =
        buildMultiRepoExperiments(disposable)

      await workspaceExperiments.isReady()

      const focusedWebview = onDidChangeIsWebviewFocused(experiments)

      await workspaceExperiments.showWebview('')

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

      const mockRunExperiment = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      stub(DvcReader.prototype, 'listStages').resolves('train')
      await workspaceExperiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN)

      expect(mockQuickPickOne).not.to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWith(dvcDemoPath)
    })
  }).timeout(WEBVIEW_TEST_TIMEOUT)

  describe('dvc.modifyExperimentParamsAndQueue', () => {
    it('should be able to queue an experiment using an existing one as a base', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const { dvcExecutor, experiments } = buildExperiments(disposable)

      const mockExperimentRunQueue = stub(
        dvcExecutor,
        'experimentRunQueue'
      ).resolves('true')

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick
        .onFirstCall()
        .resolves({
          value: EXPERIMENT_WORKSPACE_ID
        } as QuickPickItemWithValue<string>)
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
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const { experiments } = buildExperiments(disposable)

      const mockExperimentRun = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick
        .onFirstCall()
        .resolves({
          value: EXPERIMENT_WORKSPACE_ID
        } as QuickPickItemWithValue<string>)
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
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const { experiments } = buildExperiments(disposable)

      const mockExperimentRun = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick
        .onFirstCall()
        .resolves({
          value: EXPERIMENT_WORKSPACE_ID
        } as QuickPickItemWithValue<string>)
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
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const mockExperimentRunQueue = stub(
        DvcExecutor.prototype,
        'experimentRunQueue'
      ).resolves('true')

      stubWorkspaceExperimentsGetters(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.QUEUE_EXPERIMENT)

      expect(mockExperimentRunQueue).to.be.calledOnce
      expect(mockExperimentRunQueue).to.be.calledWith(dvcDemoPath)
    })

    it('should send a telemetry event containing a duration when an experiment is queued', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')

      stub(DvcExecutor.prototype, 'experimentRunQueue').resolves('true')

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      stubWorkspaceExperimentsGetters(dvcDemoPath)

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
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const duration = 77777
      mockDuration(duration)

      const mockErrorMessage =
        'ERROR: unexpected error - [Errno 2] No such file or directory'

      const mockGenericError = stub(window, 'showErrorMessage').resolves(
        undefined
      )

      stub(DvcExecutor.prototype, 'experimentRunQueue').callsFake(() => {
        throw new Error(mockErrorMessage)
      })

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      stubWorkspaceExperimentsGetters(dvcDemoPath)

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
      stub(DvcReader.prototype, 'listStages').resolves('train')
      const mockRunExperiment = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)
      stub(Setup.prototype, 'shouldBeShown').returns(false)

      stubWorkspaceExperimentsGetters(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_RUN)

      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.resumeCheckpointExperiment', () => {
    it('should be able to run an experiment', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const mockRunExperiment = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      stubWorkspaceExperimentsGetters(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_RESUME)

      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.resetAndRunCheckpointExperiment', () => {
    it('should be able to reset existing checkpoints and restart the experiment', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')
      const mockRunExperimentReset = stub(
        DvcRunner.prototype,
        'runExperimentReset'
      ).resolves(undefined)
      stub(Setup.prototype, 'shouldBeShown').returns(false)

      stubWorkspaceExperimentsGetters(dvcDemoPath)

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_RESET_AND_RUN
      )

      expect(mockRunExperimentReset).to.be.calledOnce
      expect(mockRunExperimentReset).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.stopQueuedExperiments', () => {
    it('should be able to kill running queue tasks', async () => {
      const mockQueueKill = stub(DvcExecutor.prototype, 'queueKill').resolves(
        undefined
      )

      const queueTaskId = 'exp-e7a67'

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItemWithValue<string>[] | undefined>
      >

      mockShowQuickPick.resolves([
        {
          value: queueTaskId
        } as QuickPickItemWithValue<string>
      ])

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      await commands.executeCommand(RegisteredCliCommands.QUEUE_KILL)

      expect(mockShowQuickPick).to.be.calledWithExactly(
        [
          {
            description: '[exp-e7a67]',
            detail: `Created:${formatDate(
              '2020-12-29T15:31:52'
            )}, loss:2.0205045, accuracy:0.37241668`,
            label: '4fb124a',
            value: queueTaskId
          }
        ],
        {
          canPickMany: true,
          matchOnDescription: true,
          matchOnDetail: true,
          title: Title.SELECT_QUEUE_KILL
        }
      )
      expect(mockQueueKill).to.be.calledOnce
      expect(mockQueueKill).to.be.calledWithExactly(dvcDemoPath, queueTaskId)
    })
  })

  describe('dvc.startExperimentsQueue', () => {
    it('should be able to start the experiments queue with the selected number of workers', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const mockQueueStart = stub(DvcExecutor.prototype, 'queueStart').resolves(
        undefined
      )

      const dDosNumberOfJobs = '10000'

      const mockInputBox = stub(window, 'showInputBox').resolves(
        dDosNumberOfJobs
      )

      stubWorkspaceExperimentsGetters(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.QUEUE_START)

      expect(mockQueueStart).to.be.calledOnce
      expect(mockQueueStart).to.be.calledWithExactly(
        dvcDemoPath,
        dDosNumberOfJobs
      )
      expect(mockInputBox)
    })
  })

  describe('dvc.stopExperimentsQueue', () => {
    it('should be able to stop the experiments queue', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const mockQueueStop = stub(DvcExecutor.prototype, 'queueStop').resolves(
        undefined
      )

      stubWorkspaceExperimentsGetters(dvcDemoPath)

      await commands.executeCommand(RegisteredCliCommands.QUEUE_STOP)

      expect(mockQueueStop).to.be.calledOnce
      expect(mockQueueStop).to.be.calledWithExactly(dvcDemoPath)
    })
  })

  describe('dvc.applyExperiment', () => {
    it('should ask the user to pick an experiment and then apply that experiment to the workspace', async () => {
      const selectedExperiment = 'test-branch'

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick').resolves({
        value: selectedExperiment
      } as QuickPickItemWithValue<string>)
      const mockExperimentApply = stub(DvcExecutor.prototype, 'experimentApply')

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_APPLY)

      expect(mockExperimentApply).to.be.calledWith(
        dvcDemoPath,
        selectedExperiment
      )
      expect(mockShowQuickPick).to.be.calledWith(
        [
          {
            description: '[exp-e7a67]',
            detail: `Created:${formatDate(
              '2020-12-29T15:31:52'
            )}, loss:2.0205045, accuracy:0.37241668`,
            label: '4fb124a',
            value: 'exp-e7a67'
          },
          {
            description: '[test-branch]',
            detail: `Created:${formatDate(
              '2020-12-29T15:28:59'
            )}, loss:1.9293040, accuracy:0.46680000`,
            label: '42b8736',
            value: 'test-branch'
          },
          {
            description: '[exp-83425]',
            detail: `Created:${formatDate(
              '2020-12-29T15:27:02'
            )}, loss:1.7750162, accuracy:0.59265000`,
            label: 'workspace',
            value: 'exp-83425'
          },
          {
            description: undefined,
            detail: 'Created:-, loss:-, accuracy:-',
            label: '489fd8b',
            value: '489fd8b'
          },
          {
            description: '[exp-f13bca]',
            detail: `Created:${formatDate(
              '2020-12-29T15:26:36'
            )}, loss:-, accuracy:-`,
            label: 'f0f9186',
            value: 'exp-f13bca'
          },
          {
            description: undefined,
            detail: `Created:${formatDate(
              '2020-12-29T15:25:27'
            )}, loss:-, accuracy:-`,
            label: '55d492c',
            value: '55d492c'
          }
        ],
        {
          canPickMany: false,
          matchOnDescription: true,
          matchOnDetail: true,
          title: Title.SELECT_EXPERIMENT
        }
      )
    })
  })

  describe('dvc.branchExperiment', () => {
    it('should be able to create a branch from an experiment', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const testExperiment = 'exp-83425'
      const mockBranch = 'brunch'
      const inputEvent = getInputBoxEvent(mockBranch)

      stub(window, 'showQuickPick').resolves({
        value: testExperiment
      } as QuickPickItemWithValue<string>)

      const mockExperimentBranch = stub(
        DvcExecutor.prototype,
        'experimentBranch'
      ).resolves(
        `Git branch '${mockBranch}' has been created from experiment '${testExperiment}'.        
     To switch to the new branch run:
           git checkout ${mockBranch}`
      )

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_BRANCH)

      await inputEvent
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        testExperiment,
        mockBranch
      )
    })
  })

  describe('dvc.removeExperiments', () => {
    it('should ask the user to pick experiment(s) and then remove selected ones from the workspace', async () => {
      const mockExperimentId = 'exp-e7a67'
      const secondMockExperimentId = 'exp-83425'
      type QuickPickReturnValue = QuickPickItemWithValue<string>[]

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickReturnValue | undefined>
      >

      mockShowQuickPick
        .onFirstCall()
        .resolves([
          {
            value: mockExperimentId
          }
        ] as QuickPickReturnValue)
        .onSecondCall()
        .resolves([
          {
            value: mockExperimentId
          },
          {
            value: secondMockExperimentId
          }
        ] as QuickPickReturnValue)
      const mockExperimentRemove = stub(
        DvcExecutor.prototype,
        'experimentRemove'
      )

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_REMOVE)
      expect(mockShowQuickPick).calledWithExactly(
        [
          {
            description: '[exp-e7a67]',
            detail: `Created:${formatDate(
              '2020-12-29T15:31:52'
            )}, loss:2.0205045, accuracy:0.37241668`,
            label: '4fb124a',
            value: 'exp-e7a67'
          },
          {
            description: '[test-branch]',
            detail: `Created:${formatDate(
              '2020-12-29T15:28:59'
            )}, loss:1.9293040, accuracy:0.46680000`,
            label: '42b8736',
            value: 'test-branch'
          },
          {
            description: '[exp-83425]',
            detail: `Created:${formatDate(
              '2020-12-29T15:27:02'
            )}, loss:1.7750162, accuracy:0.59265000`,
            label: EXPERIMENT_WORKSPACE_ID,
            value: 'exp-83425'
          },
          {
            description: undefined,
            detail: 'Created:-, loss:-, accuracy:-',
            label: '489fd8b',
            value: '489fd8b'
          },
          {
            description: '[exp-f13bca]',
            detail: `Created:${formatDate(
              '2020-12-29T15:26:36'
            )}, loss:-, accuracy:-`,
            label: 'f0f9186',
            value: 'exp-f13bca'
          },
          {
            description: undefined,
            detail: `Created:${formatDate(
              '2020-12-29T15:25:27'
            )}, loss:-, accuracy:-`,
            label: '90aea7f',
            value: '90aea7f'
          },
          {
            description: undefined,
            detail: `Created:${formatDate(
              '2020-12-29T15:25:27'
            )}, loss:-, accuracy:-`,
            label: '55d492c',
            value: '55d492c'
          }
        ],
        {
          canPickMany: true,
          matchOnDescription: true,
          matchOnDetail: true,
          title: 'Select Experiments to Remove'
        }
      )
      expect(mockExperimentRemove).to.be.calledWith(
        dvcDemoPath,
        mockExperimentId
      )

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_REMOVE)

      expect(mockExperimentRemove).to.be.calledWith(
        dvcDemoPath,
        mockExperimentId,
        secondMockExperimentId
      )
    })
  })

  describe('dvc.removeExperimentQueue', () => {
    it('should remove all queued experiments from the selected repository', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const mockExperimentRemove = stub(
        DvcExecutor.prototype,
        'experimentRemove'
      )

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_REMOVE_QUEUE
      )

      expect(mockExperimentRemove).to.be.calledWith(dvcDemoPath, '--queue')
    })
  })

  describe('dvc.showExperiments', () => {
    it('should show the setup if it should be shown', async () => {
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(Setup.prototype, 'shouldBeShown').returns(true)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(executeCommandSpy).to.have.been.calledWithMatch('dvc.showDvcSetup')
    })

    it('should not show the experiments webview if the setup should be shown', async () => {
      const showPlotsWebviewSpy = stub(
        WorkspaceExperiments.prototype,
        'showWebview'
      )
      stub(Setup.prototype, 'shouldBeShown').returns(true)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showPlotsWebviewSpy).not.to.be.called
    })

    it('should not show the setup if it should not be shown', async () => {
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(WorkspaceExperiments.prototype, 'showWebview').resolves()

      stub(Setup.prototype, 'shouldBeShown').returns(false)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(executeCommandSpy).not.to.be.calledWith('dvc.showDvcSetup')
    })

    it('should show the experiments webview if the setup should not be shown', async () => {
      const showPlotsWebviewSpy = stub(
        WorkspaceExperiments.prototype,
        'showWebview'
      ).resolves()
      stub(Setup.prototype, 'shouldBeShown').returns(false)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showPlotsWebviewSpy).to.be.called
    })
  })
})
