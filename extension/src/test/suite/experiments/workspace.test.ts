import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, SinonStub, match, spy } from 'sinon'
import { window, commands, QuickPickItem, Uri } from 'vscode'
import {
  buildMultiRepoExperiments,
  buildSingleRepoExperiments,
  stubWorkspaceExperimentsGetters
} from './util'
import { Disposable } from '../../../extension'
import { Experiments } from '../../../experiments'
import * as QuickPick from '../../../vscode/quickPick'
import { DvcExecutor } from '../../../cli/dvc/executor'
import {
  bypassProgressCloseDelay,
  closeAllEditors,
  getInputBoxEvent,
  getTimeSafeDisposer
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

    it('should not prompt to pick a project if a params file or dvc.yaml is focused', async () => {
      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )
      const mockRunExperiment = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      const { workspaceExperiments, experiments } =
        buildMultiRepoExperiments(disposable)

      await workspaceExperiments.isReady()

      const focusedWebview = onDidChangeIsWebviewFocused(experiments)

      await workspaceExperiments.showWebview('')

      expect(await focusedWebview).to.equal(dvcDemoPath)

      const getDvcRootFocusedEvent = () =>
        new Promise(resolve => {
          const listener: Disposable =
            experiments.onDidChangeIsExperimentsFileFocused(
              (event: string | undefined) => {
                listener.dispose()
                return resolve(event)
              }
            )
        })

      const testFile = async (path: string) => {
        const focusedDvcRoot = getDvcRootFocusedEvent()
        const uri = Uri.file(join(dvcDemoPath, path))
        await window.showTextDocument(uri)

        expect(await focusedDvcRoot).to.equal(dvcDemoPath)

        mockQuickPickOne.resetHistory()

        await workspaceExperiments.getCwdThenRun(
          AvailableCommands.EXPERIMENT_RUN
        )

        expect(mockQuickPickOne).not.to.be.called
        expect(mockRunExperiment).to.be.calledWith(dvcDemoPath)
        return closeAllEditors()
      }

      await testFile('params.yaml')
      await testFile('dvc.yaml')
    })
  }).timeout(WEBVIEW_TEST_TIMEOUT)

  describe('dvc.modifyWorkspaceParamsAndQueue', () => {
    it('should be able to queue an experiment using an existing one as a base', async () => {
      const { dvcExecutor } = await stubWorkspaceExperimentsGetters(disposable)

      const mockExperimentRunQueue = stub(dvcExecutor, 'expRunQueue').resolves(
        'true'
      )

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick.onFirstCall().resolves([
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
        RegisteredCliCommands.MODIFY_WORKSPACE_PARAMS_AND_QUEUE
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

  describe('dvc.modifyWorkspaceParamsAndResume', () => {
    it('should be able to resume a checkpoint experiment using an existing one as a base', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

      const mockExperimentRun = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick.onFirstCall().resolves([
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
        RegisteredCliCommands.MODIFY_WORKSPACE_PARAMS_AND_RESUME
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

  describe('dvc.modifyWorkspaceParamsAndRun', () => {
    it('should be able to run an experiment using an existing one as a base', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

      const mockExperimentRun = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick.onFirstCall().resolves([
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
        RegisteredCliCommands.MODIFY_WORKSPACE_PARAMS_AND_RUN
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
      await stubWorkspaceExperimentsGetters(disposable)

      const mockExperimentRunQueue = stub(
        DvcExecutor.prototype,
        'expRunQueue'
      ).resolves('true')

      await commands.executeCommand(RegisteredCliCommands.QUEUE_EXPERIMENT)

      expect(mockExperimentRunQueue).to.be.calledOnce
      expect(mockExperimentRunQueue).to.be.calledWith(dvcDemoPath)
    })

    it('should send a telemetry event containing a duration when an experiment is queued', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

      stub(DvcExecutor.prototype, 'expRunQueue').resolves('true')

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

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
      await stubWorkspaceExperimentsGetters(disposable)

      const mockErrorMessage =
        'ERROR: unexpected error - [Errno 2] No such file or directory'

      const mockGenericError = stub(window, 'showErrorMessage').resolves(
        undefined
      )

      stub(DvcExecutor.prototype, 'expRunQueue').callsFake(() => {
        throw new Error(mockErrorMessage)
      })

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      await commands.executeCommand(RegisteredCliCommands.QUEUE_EXPERIMENT)

      expect(mockSendTelemetryEvent).to.be.calledWith(
        `errors.${RegisteredCliCommands.QUEUE_EXPERIMENT}`,
        { error: mockErrorMessage }
      )
      expect(mockGenericError, 'the generic error should be shown').to.be
        .calledOnce
    })
  })

  describe('dvc.runExperiment', () => {
    it('should be able to run an experiment', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

      const mockRunExperiment = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)
      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: true,
        experiments: true
      })

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_RUN)

      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.resumeCheckpointExperiment', () => {
    it('should be able to run an experiment', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

      const mockRunExperiment = stub(
        DvcRunner.prototype,
        'runExperiment'
      ).resolves(undefined)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_RESUME)

      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.resetAndRunCheckpointExperiment', () => {
    it('should be able to reset existing checkpoints and restart the experiment', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

      const mockRunExperimentReset = stub(
        DvcRunner.prototype,
        'runExperimentReset'
      ).resolves(undefined)
      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: true,
        experiments: true
      })

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_RESET_AND_RUN
      )

      expect(mockRunExperimentReset).to.be.calledOnce
      expect(mockRunExperimentReset).to.be.calledWith(dvcDemoPath)
    })
  })

  describe('dvc.stopExperiments', () => {
    it('should be able to stop any running experiment', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

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

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_STOP)

      expect(mockShowQuickPick).to.be.calledWithExactly(
        [
          {
            description: '[exp-e7a67]',
            detail:
              'test:true, code_names:[0,1], dropout:0.15, accuracy:0.37241668, loss:2.0205045, val_accuracy:0.42780000',
            label: '4fb124a',
            value: queueTaskId
          },
          {
            description: '[exp-83425]',
            detail:
              'test:true, code_names:[0,1], dropout:0.124, accuracy:0.59265000, loss:1.7750162, val_accuracy:0.67040002',
            label: EXPERIMENT_WORKSPACE_ID,
            value: 'exp-83425'
          }
        ],
        {
          canPickMany: true,
          matchOnDescription: true,
          matchOnDetail: true,
          title: Title.SELECT_EXPERIMENTS_STOP
        }
      )
      expect(mockQueueKill).to.be.calledOnce
      expect(mockQueueKill).to.be.calledWithExactly(dvcDemoPath, queueTaskId)
    })
  })

  describe('dvc.startExperimentsQueue', () => {
    it('should be able to start the experiments queue with the selected number of workers', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

      const mockQueueStart = stub(DvcExecutor.prototype, 'queueStart').resolves(
        undefined
      )

      const dDosNumberOfJobs = '10000'

      const mockInputBox = stub(window, 'showInputBox').resolves(
        dDosNumberOfJobs
      )

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
      await stubWorkspaceExperimentsGetters(disposable)

      const mockQueueStop = stub(DvcExecutor.prototype, 'queueStop').resolves(
        undefined
      )

      await commands.executeCommand(RegisteredCliCommands.QUEUE_STOP)

      expect(mockQueueStop).to.be.calledOnce
      expect(mockQueueStop).to.be.calledWithExactly(dvcDemoPath)
    })
  })

  describe('dvc.applyExperiment', () => {
    it('should ask the user to pick a commit or experiment and then apply it to the workspace', async () => {
      const selectedExperiment = 'test-branch'

      await stubWorkspaceExperimentsGetters(disposable)

      const mockShowQuickPick = stub(window, 'showQuickPick').resolves({
        value: selectedExperiment
      } as QuickPickItemWithValue<string>)
      const mockExperimentApply = stub(DvcExecutor.prototype, 'expApply')

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_APPLY)

      expect(mockExperimentApply).to.be.calledWith(
        dvcDemoPath,
        selectedExperiment
      )

      expect(mockShowQuickPick).to.be.calledWith(
        [
          {
            description:
              '$(git-commit)Update version and CHANGELOG for release (#4022) ...',
            detail:
              'test:true, code_names:[0,1], dropout:0.122, accuracy:0.34848332, loss:2.0488560, val_accuracy:0.42780000',
            label: 'main',
            value: 'main'
          },
          {
            description: '[exp-e7a67]',
            detail:
              'test:true, code_names:[0,1], dropout:0.15, accuracy:0.37241668, loss:2.0205045, val_accuracy:0.42780000',
            label: '4fb124a',
            value: 'exp-e7a67'
          },
          {
            description: '[test-branch]',
            detail:
              'test:true, code_names:[0,1], dropout:0.122, accuracy:0.46680000, loss:1.9293040, val_accuracy:0.56080002',
            label: '42b8736',
            value: 'test-branch'
          },
          {
            description: '[exp-83425]',
            detail:
              'test:true, code_names:[0,1], dropout:0.124, accuracy:0.59265000, loss:1.7750162, val_accuracy:0.67040002',
            label: 'workspace',
            value: 'exp-83425'
          },
          {
            description: undefined,
            detail:
              'test:-, code_names:-, dropout:-, accuracy:-, loss:-, val_accuracy:-',
            label: '489fd8b',
            value: '489fd8b'
          },
          {
            description: '[exp-f13bca]',
            detail:
              'test:true, code_names:[0,1], dropout:0.124, accuracy:-, loss:-, val_accuracy:-',
            label: 'f0f9186',
            value: 'exp-f13bca'
          },
          {
            description: undefined,
            detail:
              'test:true, code_names:[0,2], dropout:0.125, accuracy:-, loss:-, val_accuracy:-',
            label: '55d492c',
            value: '55d492c'
          },
          {
            description:
              '$(git-commit)Improve "Get Started" walkthrough (#4020) ...',
            detail:
              'test:true, code_names:[0,1], dropout:0.122, accuracy:0.34848332, loss:2.0488560, val_accuracy:0.42780000',
            label: 'fe2919b',
            value: 'fe2919b'
          },
          {
            description:
              '$(git-commit)Add capabilities to text mentioning storage provider extensions (#4015)',
            detail:
              'test:true, code_names:[0,1], dropout:0.122, accuracy:0.34848332, loss:2.0488560, val_accuracy:0.42780000',
            label: '7df876c',
            value: '7df876c'
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
      await stubWorkspaceExperimentsGetters(disposable)

      const testExperiment = 'exp-83425'
      const mockBranch = 'brunch'
      const inputEvent = getInputBoxEvent(mockBranch)

      stub(window, 'showQuickPick').resolves({
        value: testExperiment
      } as QuickPickItemWithValue<string>)

      const mockExperimentBranch = stub(
        DvcExecutor.prototype,
        'expBranch'
      ).resolves(
        `Git branch '${mockBranch}' has been created from experiment '${testExperiment}'.        
     To switch to the new branch run:
           git checkout ${mockBranch}`
      )

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_BRANCH)

      await inputEvent
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        testExperiment,
        mockBranch
      )
    })
  })

  describe('dvc.pushExperiments', () => {
    it('should ask the user to pick experiment(s) and then push selected ones to the remote', async () => {
      bypassProgressCloseDelay()
      const { experiments } = await stubWorkspaceExperimentsGetters(disposable)

      stub(experiments, 'update').resolves(undefined)

      const mockExperimentId = 'exp-e7a67'
      const secondMockExperimentId = 'exp-83425'
      type QuickPickReturnValue = QuickPickItemWithValue<string>[]
      stub(Setup.prototype, 'getStudioAccessToken').returns('isat_token')

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
      const mockExpPush = stub(DvcExecutor.prototype, 'expPush')

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_PUSH)
      expect(mockShowQuickPick).calledWithExactly(
        [
          {
            description: '[exp-e7a67]',
            detail:
              'test:true, code_names:[0,1], dropout:0.15, accuracy:0.37241668, loss:2.0205045, val_accuracy:0.42780000',
            label: '4fb124a',
            value: 'exp-e7a67'
          },
          {
            description: '[test-branch]',
            detail:
              'test:true, code_names:[0,1], dropout:0.122, accuracy:0.46680000, loss:1.9293040, val_accuracy:0.56080002',
            label: '42b8736',
            value: 'test-branch'
          },
          {
            description: '[exp-83425]',
            detail:
              'test:true, code_names:[0,1], dropout:0.124, accuracy:0.59265000, loss:1.7750162, val_accuracy:0.67040002',
            label: EXPERIMENT_WORKSPACE_ID,
            value: 'exp-83425'
          },
          {
            description: undefined,
            detail:
              'test:-, code_names:-, dropout:-, accuracy:-, loss:-, val_accuracy:-',
            label: '489fd8b',
            value: '489fd8b'
          },
          {
            description: '[exp-f13bca]',
            detail:
              'test:true, code_names:[0,1], dropout:0.124, accuracy:-, loss:-, val_accuracy:-',
            label: 'f0f9186',
            value: 'exp-f13bca'
          },
          {
            description: undefined,
            detail:
              'test:true, code_names:[0,2], dropout:0.125, accuracy:-, loss:-, val_accuracy:-',
            label: '55d492c',
            value: '55d492c'
          }
        ],
        {
          canPickMany: true,
          matchOnDescription: true,
          matchOnDetail: true,
          title: 'Select Experiment(s) to Push'
        }
      )
      expect(mockExpPush).to.be.calledWith(dvcDemoPath, mockExperimentId)

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_PUSH)

      expect(mockExpPush).to.be.calledWith(
        dvcDemoPath,
        mockExperimentId,
        secondMockExperimentId
      )
    })
  })

  describe('dvc.removeExperiments', () => {
    it('should ask the user to pick experiment(s) and then remove selected ones from the workspace', async () => {
      await stubWorkspaceExperimentsGetters(disposable)

      const mockExperimentId = 'exp-e7a67'
      const secondMockExperimentId = 'exp-83425'
      type QuickPickReturnValue = QuickPickItemWithValue<string>[]

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
      const mockExperimentRemove = stub(DvcExecutor.prototype, 'expRemove')

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_REMOVE)
      expect(mockShowQuickPick).calledWithExactly(
        [
          {
            description: '[exp-e7a67]',
            detail:
              'test:true, code_names:[0,1], dropout:0.15, accuracy:0.37241668, loss:2.0205045, val_accuracy:0.42780000',
            label: '4fb124a',
            value: 'exp-e7a67'
          },
          {
            description: '[test-branch]',
            detail:
              'test:true, code_names:[0,1], dropout:0.122, accuracy:0.46680000, loss:1.9293040, val_accuracy:0.56080002',
            label: '42b8736',
            value: 'test-branch'
          },
          {
            description: '[exp-83425]',
            detail:
              'test:true, code_names:[0,1], dropout:0.124, accuracy:0.59265000, loss:1.7750162, val_accuracy:0.67040002',
            label: EXPERIMENT_WORKSPACE_ID,
            value: 'exp-83425'
          },
          {
            description: undefined,
            detail:
              'test:-, code_names:-, dropout:-, accuracy:-, loss:-, val_accuracy:-',
            label: '489fd8b',
            value: '489fd8b'
          },
          {
            description: '[exp-f13bca]',
            detail:
              'test:true, code_names:[0,1], dropout:0.124, accuracy:-, loss:-, val_accuracy:-',
            label: 'f0f9186',
            value: 'exp-f13bca'
          },
          {
            description: undefined,
            detail:
              'test:true, code_names:[0,1], dropout:0.124, accuracy:-, loss:-, val_accuracy:-',
            label: '90aea7f',
            value: '90aea7f'
          },
          {
            description: undefined,
            detail:
              'test:true, code_names:[0,2], dropout:0.125, accuracy:-, loss:-, val_accuracy:-',
            label: '55d492c',
            value: '55d492c'
          }
        ],
        {
          canPickMany: true,
          matchOnDescription: true,
          matchOnDetail: true,
          title: 'Select Experiment(s) to Remove'
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
      await stubWorkspaceExperimentsGetters(disposable)

      const mockExperimentRemove = stub(DvcExecutor.prototype, 'expRemove')

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_REMOVE_QUEUE
      )

      expect(mockExperimentRemove).to.be.calledWith(dvcDemoPath, '--queue')
    })
  })

  describe('dvc.showExperiments', () => {
    it('should show the dvc setup section if dvc is not setup', async () => {
      const showExperimentsWebviewSpy = stub(
        WorkspaceExperiments.prototype,
        'showWebview'
      )
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: false,
        experiments: false
      })

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showExperimentsWebviewSpy).not.to.be.called
      expect(executeCommandSpy).to.have.been.calledWithMatch('dvc.showDvcSetup')
    })

    it('should show the experiments setup section if dvc is setup but experiments are not', async () => {
      const showExperimentsWebviewSpy = stub(
        WorkspaceExperiments.prototype,
        'showWebview'
      )
      const executeCommandSpy = spy(commands, 'executeCommand')
      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: true,
        experiments: false
      })

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showExperimentsWebviewSpy).not.to.be.called
      expect(executeCommandSpy).to.have.been.calledWithMatch(
        'dvc.showExperimentsSetup'
      )
    })

    it('should not show the setup if it should not be shown', async () => {
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(WorkspaceExperiments.prototype, 'showWebview').resolves()

      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: true,
        experiments: true
      })

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(executeCommandSpy).not.to.be.calledWith('dvc.showDvcSetup')
      expect(executeCommandSpy).not.to.be.calledWith('dvc.showExperimentsSetup')
    })

    it('should show the experiments webview if the setup should not be shown', async () => {
      const showExperimentsWebviewSpy = stub(
        WorkspaceExperiments.prototype,
        'showWebview'
      ).resolves()
      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: true,
        experiments: true
      })

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)

      expect(showExperimentsWebviewSpy).to.be.called
    })
  })
})
