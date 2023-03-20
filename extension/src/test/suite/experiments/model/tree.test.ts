import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy, SinonStub } from 'sinon'
import {
  commands,
  EventEmitter,
  QuickPick,
  QuickPickItem,
  TreeView,
  TreeViewExpansionEvent,
  window
} from 'vscode'
import { ExperimentType } from '../../../../experiments/model'
import { UNSELECTED } from '../../../../experiments/model/status'
import {
  getFirstArgOfLastCall,
  getTimeSafeDisposer,
  spyOnPrivateMethod,
  stubPrivatePrototypeMethod
} from '../../util'
import { dvcDemoPath } from '../../../util'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../../commands/external'
import { buildPlots, getExpectedCustomPlotsData } from '../../plots/util'
import customPlotsFixture from '../../../fixtures/expShow/base/customPlots'
import expShowFixture from '../../../fixtures/expShow/base/output'
import plotsRevisionsFixture from '../../../fixtures/plotsDiff/revisions'
import { ExperimentsTree } from '../../../../experiments/model/tree'
import {
  buildExperiments,
  buildSingleRepoExperiments,
  stubWorkspaceExperimentsGetters
} from '../util'
import { ResourceLocator } from '../../../../resourceLocator'
import { WEBVIEW_TEST_TIMEOUT } from '../../timeouts'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../../vscode/quickPick'
import * as QuickPickWrapper from '../../../../vscode/quickPick'
import { DvcExecutor } from '../../../../cli/dvc/executor'
import { Param } from '../../../../experiments/model/modify/collect'
import { WorkspaceExperiments } from '../../../../experiments/workspace'
import { ExperimentItem } from '../../../../experiments/model/collect'
import { EXPERIMENT_WORKSPACE_ID } from '../../../../cli/dvc/contract'
import { DvcReader } from '../../../../cli/dvc/reader'
import {
  ColorScale,
  CustomPlotType,
  DEFAULT_SECTION_COLLAPSED
} from '../../../../plots/webview/contract'

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
    const { colors } = customPlotsFixture
    const { domain, range } = colors as ColorScale

    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether an experiment is shown in the plots webview with dvc.views.experiments.toggleStatus', async () => {
      const { plots, messageSpy } = await buildPlots(disposable)

      const expectedDomain = [...domain]
      const expectedRange = [...range]

      const webview = await plots.showWebview()

      await webview.isReady()

      while (expectedDomain.length > 0) {
        const expectedData = getExpectedCustomPlotsData(
          expectedDomain,
          expectedRange
        )

        const { custom } = getFirstArgOfLastCall(messageSpy)

        expect(
          { custom },
          'a message is sent with colors for the currently selected experiments'
        ).to.deep.equal(expectedData)
        messageSpy.resetHistory()

        const id = expectedDomain.pop()
        expectedRange.pop()

        const unSelected = await commands.executeCommand(
          RegisteredCommands.EXPERIMENT_TOGGLE,
          {
            dvcRoot: dvcDemoPath,
            id
          }
        )

        expect(unSelected).to.equal(UNSELECTED)
      }

      expect(
        messageSpy,
        'when there are no experiments selected we dont send checkpoint type plots'
      ).to.be.calledWithMatch({
        comparison: null,
        custom: {
          ...customPlotsFixture,
          colors: undefined,
          plots: customPlotsFixture.plots.filter(
            plot => plot.type !== CustomPlotType.CHECKPOINT
          )
        },
        hasPlots: false,
        hasUnselectedPlots: false,
        sectionCollapsed: DEFAULT_SECTION_COLLAPSED,
        selectedRevisions: plotsRevisionsFixture.slice(0, 2),
        template: null
      })
      messageSpy.resetHistory()

      expectedDomain.push(domain[0])
      expectedRange.push(range[0])

      const selected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          id: domain[0]
        }
      )

      expect(selected, 'the experiment is now selected').to.equal(range[0])

      expect(messageSpy, 'we no longer send null').to.be.calledWithMatch(
        getExpectedCustomPlotsData(expectedDomain, expectedRange)
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set the workspace to selected when trying to toggle a checkpoint experiment that is running in the workspace', async () => {
      const { experiments } = buildExperiments(disposable, {
        '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77': {
          '4fb124aebddb2adf1545030907687fa9a4c80e70': {
            data: {
              ...expShowFixture['53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'][
                '4fb124aebddb2adf1545030907687fa9a4c80e70'
              ].data,
              executor: EXPERIMENT_WORKSPACE_ID
            }
          },
          baseline:
            expShowFixture['53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'].baseline
        },
        workspace: expShowFixture.workspace
      })
      const isWorkspaceSelected = (): boolean =>
        !!experiments
          .getWorkspaceAndCommits()
          .find(({ id }) => id === EXPERIMENT_WORKSPACE_ID)?.selected

      await experiments.isReady()
      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)
      expect(isWorkspaceSelected()).to.be.true

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_TOGGLE, {
        dvcRoot: dvcDemoPath,
        id: EXPERIMENT_WORKSPACE_ID
      })

      expect(isWorkspaceSelected()).to.be.false

      const selected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          id: 'exp-e7a67'
        }
      )
      expect(!!selected).to.be.true

      expect(isWorkspaceSelected()).to.be.true

      const notReselected = await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_TOGGLE,
        {
          dvcRoot: dvcDemoPath,
          id: 'exp-e7a67'
        }
      )
      expect(notReselected).to.be.undefined

      expect(isWorkspaceSelected()).to.be.true
    })

    it('should not show queued experiments in the dvc.views.experimentsTree.selectExperiments quick pick', async () => {
      await buildPlots(disposable)

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
      const { plots, messageSpy } = await buildPlots(disposable)

      const selectedDisplayName = domain[0]
      const selectedColor = range[0]
      const selectedItem = {
        description: selectedDisplayName,
        label: '',
        value: { id: selectedDisplayName }
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

      expect(
        messageSpy,
        'a message is sent with colors for the currently selected experiments'
      ).to.be.calledWithMatch(
        getExpectedCustomPlotsData([selectedDisplayName], [selectedColor])
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should retain the expanded state of experiment tree items', () => {
      const { workspaceExperiments } = buildSingleRepoExperiments(disposable)

      const elementCollapsed = disposable.track(
        new EventEmitter<TreeViewExpansionEvent<ExperimentItem>>()
      )
      const elementExpanded = disposable.track(
        new EventEmitter<TreeViewExpansionEvent<ExperimentItem>>()
      )

      stub(window, 'createTreeView').returns({
        dispose: stub(),
        onDidCollapseElement: elementCollapsed.event,
        onDidExpandElement: elementExpanded.event
      } as unknown as TreeView<string | ExperimentItem>)
      stub(commands, 'registerCommand')

      const experimentsTree = disposable.track(
        new ExperimentsTree(workspaceExperiments, {} as ResourceLocator)
      )

      const description = '[exp-1234]'

      const setExpandedSpy = spyOnPrivateMethod(
        experimentsTree,
        'setExperimentExpanded'
      )

      elementExpanded.fire({ element: { description } as ExperimentItem })

      expect(
        setExpandedSpy,
        'the experiment should be set to expanded'
      ).to.be.calledOnceWith(description, true)

      setExpandedSpy.resetHistory()

      elementCollapsed.fire({ element: { description } as ExperimentItem })

      expect(
        setExpandedSpy,
        'the experiment should be set to collapsed'
      ).to.be.calledOnceWith(description, false)
    })

    it('should be able to remove an experiment with dvc.views.experimentsTree.removeExperiment', async () => {
      const mockExperimentId = 'exp-to-remove'
      const mockExperiment = {
        dvcRoot: dvcDemoPath,
        id: mockExperimentId,
        type: ExperimentType.EXPERIMENT
      }

      const mockExperimentRemove = stub(
        DvcExecutor.prototype,
        'experimentRemove'
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
        'experimentRemove'
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
        'experimentRemove'
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
          id: 'checkpoint-excluded',
          type: ExperimentType.CHECKPOINT
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

    it('should be able to apply an experiment to the workspace with dvc.views.experiments.applyExperiment', async () => {
      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      const mockExperiment = 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9'

      const mockExperimentApply = stub(
        DvcExecutor.prototype,
        'experimentApply'
      ).resolves(
        `Changes for experiment '${mockExperiment}' have been applied to your current workspace.`
      )
      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_VIEW_APPLY,
        {
          dvcRoot: dvcDemoPath,
          id: mockExperiment
        }
      )

      expect(mockExperimentApply).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperiment.slice(0, 7)
      )
    })

    it('should not create a new branch from an experiment with dvc.views.experiments.branchExperiment if the user cancels', async () => {
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const mockExperimentBranch = stub(
        DvcExecutor.prototype,
        'experimentBranch'
      )
      const mockShowInputBox = stub(window, 'showInputBox').resolves(undefined)
      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_VIEW_BRANCH,
        {
          dvcRoot: dvcDemoPath,
          id: 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9'
        }
      )

      expect(mockShowInputBox).to.be.calledOnce
      expect(mockExperimentBranch).not.to.be.called
    })

    it('should be able to create a new branch from an experiment with dvc.views.experiments.branchExperiment', async () => {
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const mockCheckpoint = 'e821416'
      const mockBranch = 'it-is-a-branch'

      const mockExperimentBranch = stub(
        DvcExecutor.prototype,
        'experimentBranch'
      ).resolves(
        `Git branch '${mockBranch}' has been created from experiment '${mockCheckpoint}'.        
       To switch to the new branch run:
             git checkout ${mockBranch}`
      )
      const mockShowInputBox = stub(window, 'showInputBox').resolves(mockBranch)
      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

      await commands.executeCommand(
        RegisteredCliCommands.EXPERIMENT_VIEW_BRANCH,
        {
          dvcRoot: dvcDemoPath,
          id: 'e821416bfafb4bc28b3e0a8ddb322505b0ad2361'
        }
      )

      expect(mockShowInputBox).to.be.calledOnce
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        mockCheckpoint,
        mockBranch
      )
    })

    it('should be able to queue an experiment from an existing one with dvc.views.experiments.queueExperiment', async () => {
      const baseExperimentId = EXPERIMENT_WORKSPACE_ID
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const { dvcExecutor, experiments, experimentsModel } =
        buildExperiments(disposable)

      await experiments.isReady()

      const mockExperimentRunQueue = stub(
        dvcExecutor,
        'experimentRunQueue'
      ).resolves('true')

      const [mockGetOnlyOrPickProject] = stubWorkspaceExperimentsGetters(
        '',
        experiments
      )

      const getParamsSpy = spy(experimentsModel, 'getExperimentParams')

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
          dvcRoot: dvcDemoPath,
          id: baseExperimentId
        }
      )

      expect(mockGetOnlyOrPickProject).not.to.be.called
      expect(getParamsSpy).to.be.calledOnce
      expect(getParamsSpy).to.be.calledWithExactly(baseExperimentId)
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
      const baseExperimentId = EXPERIMENT_WORKSPACE_ID
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const { dvcRunner, experiments, experimentsModel } =
        buildExperiments(disposable)

      await experiments.isReady()

      const mockRunExperiment = stub(dvcRunner, 'runExperiment').resolves(
        undefined
      )

      const [mockGetOnlyOrPickProject] = stubWorkspaceExperimentsGetters(
        '',
        experiments
      )

      const getParamsSpy = spy(experimentsModel, 'getExperimentParams')

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
        dvcRoot: dvcDemoPath,
        id: baseExperimentId
      })

      expect(mockGetOnlyOrPickProject).not.to.be.called
      expect(getParamsSpy).to.be.calledOnce
      expect(getParamsSpy).to.be.calledWithExactly(baseExperimentId)
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
      const baseExperimentId = EXPERIMENT_WORKSPACE_ID
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const { dvcRunner, experiments, experimentsModel } =
        buildExperiments(disposable)

      await experiments.isReady()

      const mockRunExperimentReset = stub(
        dvcRunner,
        'runExperimentReset'
      ).resolves(undefined)

      const [mockGetOnlyOrPickProject] = stubWorkspaceExperimentsGetters(
        '',
        experiments
      )

      const getParamsSpy = spy(experimentsModel, 'getExperimentParams')

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
          dvcRoot: dvcDemoPath,
          id: baseExperimentId
        }
      )

      expect(mockGetOnlyOrPickProject).not.to.be.called
      expect(getParamsSpy).to.be.calledOnce
      expect(getParamsSpy).to.be.calledWithExactly(baseExperimentId)
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
