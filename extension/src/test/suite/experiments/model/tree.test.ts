import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy, SinonStub } from 'sinon'
import {
  commands,
  EventEmitter,
  QuickPick,
  QuickPickItem,
  window
} from 'vscode'
import { ExperimentType } from '../../../../experiments/model'
import { UNSELECTED } from '../../../../experiments/model/status'
import {
  bypassProcessManagerDebounce,
  bypassProgressCloseDelay,
  getFirstArgOfLastCall,
  getMockNow,
  getTimeSafeDisposer,
  stubPrivatePrototypeMethod
} from '../../util'
import { dvcDemoPath } from '../../../util'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../../commands/external'
import { buildPlots } from '../../plots/util'
import { ExperimentsTree } from '../../../../experiments/model/tree'
import { buildExperiments, stubWorkspaceExperimentsGetters } from '../util'
import { WEBVIEW_TEST_TIMEOUT } from '../../timeouts'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../../vscode/quickPick'
import * as QuickPickWrapper from '../../../../vscode/quickPick'
import { DvcExecutor } from '../../../../cli/dvc/executor'
import { Param } from '../../../../experiments/model/modify/collect'
import { WorkspaceExperiments } from '../../../../experiments/workspace'
import { EXPERIMENT_WORKSPACE_ID } from '../../../../cli/dvc/contract'
import { copyOriginalColors } from '../../../../experiments/model/status/colors'
import { Revision } from '../../../../plots/webview/contract'
import { BaseWebview } from '../../../../webview'
import { Experiment } from '../../../../experiments/webview/contract'

suite('Experiments Tree Test Suite', () => {
  const disposable = getTimeSafeDisposer()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    return disposable.disposeAndFlush()
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('ExperimentsTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether an experiment is shown in the plots webview with dvc.views.experiments.toggleStatus', async () => {
      const mockNow = getMockNow()

      const { plots, messageSpy, plotsModel, experimentsModel } =
        await buildPlots({ disposer: disposable })
      messageSpy.restore()
      const mockShow = stub(BaseWebview.prototype, 'show')

      experimentsModel.setSelected([
        { id: EXPERIMENT_WORKSPACE_ID },
        { id: 'main' },
        { id: 'test-branch' },
        { id: 'exp-f13bca' }
      ] as Experiment[])

      const expectedRevisions: { displayColor: string; id: string }[] = []

      const [{ id }] = plotsModel.getSelectedRevisionDetails()

      for (const {
        id,
        displayColor
      } of plotsModel.getSelectedRevisionDetails()) {
        expectedRevisions.push({ displayColor, id })
      }

      const webview = await plots.showWebview()

      await webview.isReady()

      let updateCall = 1
      while (expectedRevisions.length > 0) {
        const { selectedRevisions } = mockShow.lastCall.firstArg

        expect(
          (selectedRevisions as Revision[]).map(({ displayColor, id }) => ({
            displayColor,
            id
          })),
          'a message is sent with colors for the currently selected experiments'
        ).to.deep.equal(expectedRevisions)
        mockShow.resetHistory()
        mockShow.resetBehavior()

        const { id } = expectedRevisions.pop() as { id: string }

        const messageSent = new Promise(resolve =>
          mockShow.callsFake(() => {
            resolve(undefined)
            return Promise.resolve(true)
          })
        )

        bypassProcessManagerDebounce(mockNow, updateCall)
        const unSelected = await commands.executeCommand(
          RegisteredCommands.EXPERIMENT_TOGGLE,
          {
            dvcRoot: dvcDemoPath,
            id
          }
        )
        updateCall = updateCall + 1

        expect(unSelected).to.equal(UNSELECTED)
        await messageSent
      }

      expect(
        mockShow,
        "when there are no experiments selected we don't send any template plots"
      ).to.be.calledWithMatch({
        template: null
      })
      mockShow.resetHistory()

      const messageSent = new Promise(resolve =>
        mockShow.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(true)
        })
      )

      bypassProcessManagerDebounce(mockNow, updateCall)
      const selected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          id
        }
      )

      await messageSent

      expect(selected, 'the experiment is now selected').to.equal(
        copyOriginalColors()[0]
      )

      expect(messageSpy, 'we no longer send null').not.to.be.calledWithMatch({
        template: null
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should not show queued experiments in the dvc.views.experimentsTree.selectExperiments quick pick', async () => {
      await buildPlots({ disposer: disposable })

      const mockQuickPickLimitedValues = stub(
        QuickPickWrapper,
        'quickPickLimitedValues'
      ).resolves(undefined)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SELECT)

      const [availableItems] = mockQuickPickLimitedValues.lastCall.args

      expect(availableItems.length).to.be.greaterThan(0)
      const queued = []

      for (const experimentOrSeparator of availableItems) {
        if (
          (experimentOrSeparator?.value as { type: ExperimentType })?.type ===
          ExperimentType.QUEUED
        ) {
          queued.push(experimentOrSeparator)
        }
      }

      expect(mockQuickPickLimitedValues).to.be.calledOnce
      expect(queued).to.deep.equal([])
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to select / de-select experiments using dvc.views.experimentsTree.selectExperiments', async () => {
      const { plots, plotsModel, messageSpy } = await buildPlots({
        disposer: disposable
      })

      const [{ label, displayColor }] = plotsModel.getSelectedRevisionDetails()

      const selectedItem = {
        description: label,
        label: '',
        value: { id: label }
      }

      await plots.showWebview()

      const inputAccepted = disposable.track(new EventEmitter<void>())
      const mockEvent = disposable.track(new EventEmitter()).event

      const mockCreateQuickPick = stub(window, 'createQuickPick')
      const mockQuickPick = {
        onDidAccept: inputAccepted.event,
        onDidChangeSelection: mockEvent,
        onDidHide: mockEvent,
        placeholder: undefined,
        selectedItems: [] as { id: string }[],
        show: stub(),
        value: undefined
      } as unknown as QuickPick<QuickPickItemWithValue<{ id: string }>>

      const quickPickCreated = new Promise(resolve =>
        mockCreateQuickPick.callsFake(() => {
          resolve(undefined)
          return mockQuickPick
        })
      )

      const selectExperiments = commands.executeCommand(
        RegisteredCommands.EXPERIMENT_SELECT
      )

      await quickPickCreated
      mockQuickPick.selectedItems = [selectedItem]
      inputAccepted.fire()
      await selectExperiments

      expect(mockCreateQuickPick).to.be.calledOnce

      const { selectedRevisions } = getFirstArgOfLastCall(messageSpy)

      expect(
        (selectedRevisions as Revision[]).map(({ displayColor, label }) => ({
          displayColor,
          label
        })),
        'a message is sent with colors for the currently selected experiments'
      ).to.deep.equal([{ displayColor, label }])
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to remove an experiment with dvc.views.experimentsTree.removeExperiment', async () => {
      const mockExperimentId = 'exp-to-remove'
      const mockExperiment = {
        dvcRoot: dvcDemoPath,
        id: mockExperimentId,
        type: ExperimentType.EXPERIMENT
      }

      const mockExperimentRemove = stub(
        DvcExecutor.prototype,
        'expRemove'
      ).resolves('')

      stubPrivatePrototypeMethod(
        ExperimentsTree,
        'getSelectedExperimentItems'
      ).returns([mockExperiment])

      await commands.executeCommand(
        'dvc.views.experimentsTree.removeExperiment',
        mockExperiment
      )

      expect(mockExperimentRemove).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperimentId
      )
    })

    it('should be able to remove the provided experiment with dvc.views.experimentsTree.removeExperiment (if no experiments are selected)', async () => {
      const mockExperiment = 'exp-to-remove'

      const mockExperimentRemove = stub(
        DvcExecutor.prototype,
        'expRemove'
      ).resolves('')

      stubPrivatePrototypeMethod(
        ExperimentsTree,
        'getSelectedExperimentItems'
      ).returns([])

      await commands.executeCommand(
        'dvc.views.experimentsTree.removeExperiment',
        {
          dvcRoot: dvcDemoPath,
          id: mockExperiment,
          type: ExperimentType.EXPERIMENT
        }
      )

      expect(mockExperimentRemove).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperiment
      )
    })

    it('should be able to remove multiple experiments with dvc.views.experimentsTree.removeExperiment', async () => {
      const mockExperimentId = 'exp-removed'
      const mockQueuedExperimentLabel = 'queued-removed'

      const mockExperimentRemove = stub(
        DvcExecutor.prototype,
        'expRemove'
      ).resolves('')

      stubPrivatePrototypeMethod(
        ExperimentsTree,
        'getSelectedExperimentItems'
      ).returns([
        dvcDemoPath,
        {
          dvcRoot: dvcDemoPath,
          label: mockQueuedExperimentLabel,
          type: ExperimentType.QUEUED
        },
        {
          dvcRoot: dvcDemoPath,
          id: 'workspace-excluded',
          type: ExperimentType.WORKSPACE
        }
      ])

      await commands.executeCommand(
        'dvc.views.experimentsTree.removeExperiment',
        {
          dvcRoot: dvcDemoPath,
          id: mockExperimentId,
          type: ExperimentType.EXPERIMENT
        }
      )

      expect(mockExperimentRemove).to.be.calledWithExactly(
        dvcDemoPath,
        mockQueuedExperimentLabel,
        mockExperimentId
      )
    })

    it('should be able to push an experiment with dvc.views.experimentsTree.pushExperiment', async () => {
      bypassProgressCloseDelay()
      const mockExperimentId = 'exp-to-push'
      const mockExperiment = {
        dvcRoot: dvcDemoPath,
        id: mockExperimentId,
        type: ExperimentType.EXPERIMENT
      }

      const mockExpPush = stub(DvcExecutor.prototype, 'expPush').resolves('')

      stubPrivatePrototypeMethod(
        ExperimentsTree,
        'getSelectedExperimentItems'
      ).returns([mockExperiment])

      await commands.executeCommand(
        'dvc.views.experimentsTree.pushExperiment',
        mockExperiment
      )

      expect(mockExpPush).to.be.calledWithExactly(dvcDemoPath, mockExperimentId)
    })

    it('should be able to push the provided experiment with dvc.views.experimentsTree.pushExperiment (if no experiments are selected)', async () => {
      bypassProgressCloseDelay()
      const mockExperiment = 'exp-to-push'

      const mockExpPush = stub(DvcExecutor.prototype, 'expPush').resolves('')

      stubPrivatePrototypeMethod(
        ExperimentsTree,
        'getSelectedExperimentItems'
      ).returns([])

      await commands.executeCommand(
        'dvc.views.experimentsTree.pushExperiment',
        {
          dvcRoot: dvcDemoPath,
          id: mockExperiment,
          type: ExperimentType.EXPERIMENT
        }
      )

      expect(mockExpPush).to.be.calledWithExactly(dvcDemoPath, mockExperiment)
    })

    it('should be able to push multiple experiments with dvc.views.experimentsTree.pushExperiment', async () => {
      bypassProgressCloseDelay()
      const mockFirstExperimentId = 'first-exp-pushed'
      const mockSecondExperimentId = 'second-exp-pushed'
      const mockQueuedExperimentLabel = 'queued-excluded'

      const mockExpPush = stub(DvcExecutor.prototype, 'expPush').resolves('')

      stubPrivatePrototypeMethod(
        ExperimentsTree,
        'getSelectedExperimentItems'
      ).returns([
        dvcDemoPath,
        {
          dvcRoot: dvcDemoPath,
          label: mockQueuedExperimentLabel,
          type: ExperimentType.QUEUED
        },
        {
          dvcRoot: dvcDemoPath,
          id: mockFirstExperimentId,
          type: ExperimentType.EXPERIMENT
        },
        {
          dvcRoot: dvcDemoPath,
          id: 'workspace-excluded',
          type: ExperimentType.WORKSPACE
        }
      ])

      await commands.executeCommand(
        'dvc.views.experimentsTree.pushExperiment',
        {
          dvcRoot: dvcDemoPath,
          id: mockSecondExperimentId,
          type: ExperimentType.EXPERIMENT
        }
      )

      expect(mockExpPush).to.be.calledWithExactly(
        dvcDemoPath,
        mockFirstExperimentId,
        mockSecondExperimentId
      )
    })

    it('should be able to stop multiple running experiments with dvc.views.experimentsTree.stopExperiment', async () => {
      bypassProgressCloseDelay()
      const mockFirstExperimentId = 'first-exp-stopped'
      const mockSecondExperimentId = 'second-exp-stopped'
      const mockQueuedExperimentLabel = 'queued-excluded'

      const mockStopExperiments = stub(
        WorkspaceExperiments.prototype,
        'stopExperiments'
      ).resolves(undefined)

      stubPrivatePrototypeMethod(
        ExperimentsTree,
        'getSelectedExperimentItems'
      ).returns([
        dvcDemoPath,
        {
          dvcRoot: dvcDemoPath,
          label: mockQueuedExperimentLabel,
          type: ExperimentType.QUEUED
        },
        {
          dvcRoot: dvcDemoPath,
          id: mockFirstExperimentId,
          type: ExperimentType.RUNNING
        },
        {
          dvcRoot: dvcDemoPath,
          id: 'workspace-excluded',
          type: ExperimentType.WORKSPACE
        }
      ])

      await commands.executeCommand(
        'dvc.views.experimentsTree.stopExperiment',
        {
          dvcRoot: dvcDemoPath,
          id: mockSecondExperimentId,
          type: ExperimentType.RUNNING
        }
      )

      expect(mockStopExperiments).to.be.calledWithExactly(
        dvcDemoPath,
        mockFirstExperimentId,
        mockSecondExperimentId
      )
    })

    it('should be able to apply an experiment to the workspace with dvc.views.experiments.applyExperiment', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

      await experiments.isReady()

      const mockExperimentId = 'exp-e7a67'

      const mockExperimentApply = stub(
        DvcExecutor.prototype,
        'expApply'
      ).resolves(
        `Changes for experiment '${mockExperimentId}' have been applied to your current workspace.`
      )
      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_VIEW_APPLY,
        {
          dvcRoot: dvcDemoPath,
          id: mockExperimentId
        }
      )

      expect(mockExperimentApply).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperimentId
      )
    })

    it('should not create a new branch from an experiment with dvc.views.experiments.branchExperiment if the user cancels', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })
      await experiments.isReady()

      const mockExperimentBranch = stub(DvcExecutor.prototype, 'expBranch')
      const mockShowInputBox = stub(window, 'showInputBox').resolves(undefined)
      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_VIEW_BRANCH,
        {
          dvcRoot: dvcDemoPath,
          id: 'exp-e7a67'
        }
      )

      expect(mockShowInputBox).to.be.calledOnce
      expect(mockExperimentBranch).not.to.be.called
    })

    it('should be able to create a new branch from an experiment with dvc.views.experiments.branchExperiment', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })
      await experiments.isReady()

      const mockExperimentId = 'exp-e7a67'
      const mockBranch = 'it-is-a-branch'

      const mockExperimentBranch = stub(
        DvcExecutor.prototype,
        'expBranch'
      ).resolves(
        `Git branch '${mockBranch}' has been created from experiment '${mockExperimentId}'.        
       To switch to the new branch run:
             git checkout ${mockBranch}`
      )
      const mockShowInputBox = stub(window, 'showInputBox').resolves(mockBranch)
      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_VIEW_BRANCH,
        {
          dvcRoot: dvcDemoPath,
          id: mockExperimentId
        }
      )

      expect(mockShowInputBox).to.be.calledOnce
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperimentId,
        mockBranch
      )
    })

    it('should be able to queue an experiment from an existing one with dvc.views.experiments.queueExperiment', async () => {
      const {
        dvcExecutor,
        experiments,
        experimentsModel,
        mockGetOnlyOrPickProject
      } = stubWorkspaceExperimentsGetters(disposable)

      await experiments.isReady()

      const mockExperimentRunQueue = stub(dvcExecutor, 'expRunQueue').resolves(
        'true'
      )

      const getParamsSpy = spy(experimentsModel, 'getWorkspaceParams')

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick.resolves([
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
        .resolves('0.101')
        .onSecondCall()
        .resolves('0.102')

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_VIEW_QUEUE,
        {
          dvcRoot: dvcDemoPath
        }
      )

      expect(mockGetOnlyOrPickProject).not.to.be.called
      expect(getParamsSpy).to.be.calledOnce
      expect(mockShowQuickPick).to.be.calledOnce
      expect(mockExperimentRunQueue).to.be.calledOnce
      expect(mockExperimentRunQueue).to.be.calledWith(
        dvcDemoPath,
        '-S',
        'params.yaml:dropout=0.101',
        '-S',
        'params.yaml:process.threshold=0.102'
      )
    })

    it('should be able to run a new experiment from an existing one with dvc.views.experiments.runExperiment', async () => {
      const {
        dvcRunner,
        experiments,
        experimentsModel,
        mockGetOnlyOrPickProject
      } = stubWorkspaceExperimentsGetters(disposable)

      await experiments.isReady()

      const mockRunExperiment = stub(dvcRunner, 'runExperiment').resolves(
        undefined
      )

      const getParamsSpy = spy(experimentsModel, 'getWorkspaceParams')

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick.resolves([
        {
          label: 'params.yaml:dropout',
          value: { path: 'params.yaml:dropout', value: 0.16 }
        },
        {
          label: 'params.yaml:process.threshold',
          value: { path: 'params.yaml:process.threshold', value: 0.1 }
        }
      ] as QuickPickItemWithValue<Param>[])

      stub(window, 'showInputBox')
        .onFirstCall()
        .resolves('0.15')
        .onSecondCall()
        .resolves('0.82')

      await commands.executeCommand(RegisteredCliCommands.EXPERIMENT_VIEW_RUN, {
        dvcRoot: dvcDemoPath
      })

      expect(mockGetOnlyOrPickProject).not.to.be.called
      expect(getParamsSpy).to.be.calledOnce
      expect(mockShowQuickPick).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWith(
        dvcDemoPath,
        '-S',
        'params.yaml:dropout=0.15',
        '-S',
        'params.yaml:process.threshold=0.82'
      )
    })

    it('should be able to reset and run a new checkpoint experiment from an existing one with dvc.views.experiments.resetAndRunCheckpointExperiment', async () => {
      const {
        dvcRunner,
        experiments,
        experimentsModel,
        mockGetOnlyOrPickProject
      } = stubWorkspaceExperimentsGetters(disposable)
      await experiments.isReady()

      const mockRunExperimentReset = stub(
        dvcRunner,
        'runExperimentReset'
      ).resolves(undefined)

      const getParamsSpy = spy(experimentsModel, 'getWorkspaceParams')

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick.resolves([
        {
          label: 'params.yaml:dropout',
          value: { path: 'params.yaml:dropout', value: 0.1 }
        },
        {
          label: 'params.yaml:process.threshold',
          value: { path: 'params.yaml:process.threshold', value: 0.8 }
        }
      ] as QuickPickItemWithValue<Param>[])

      stub(window, 'showInputBox')
        .onFirstCall()
        .resolves('0.11')
        .onSecondCall()
        .resolves('0.82')

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_VIEW_RESET_AND_RUN,
        {
          dvcRoot: dvcDemoPath
        }
      )

      expect(mockGetOnlyOrPickProject).not.to.be.called
      expect(getParamsSpy).to.be.calledOnce
      expect(mockShowQuickPick).to.be.calledOnce
      expect(mockRunExperimentReset).to.be.calledOnce
      expect(mockRunExperimentReset).to.be.calledWith(
        dvcDemoPath,
        '-S',
        'params.yaml:dropout=0.11',
        '-S',
        'params.yaml:process.threshold=0.82'
      )
    })
  })
})
