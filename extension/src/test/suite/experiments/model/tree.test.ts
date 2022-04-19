import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy, SinonStub } from 'sinon'
import {
  commands,
  EventEmitter,
  MessageItem,
  QuickPick,
  QuickPickItem,
  TreeView,
  TreeViewExpansionEvent,
  window
} from 'vscode'
import { addFilterViaQuickInput } from './filterBy/util'
import { Disposable } from '../../../../extension'
import { ExperimentsModel, ExperimentType } from '../../../../experiments/model'
import { Status } from '../../../../experiments/model/status'
import { experimentsUpdatedEvent, getFirstArgOfLastCall } from '../../util'
import { dvcDemoPath } from '../../../util'
import { RegisteredCommands } from '../../../../commands/external'
import { buildPlots, getExpectedCheckpointPlotsData } from '../../plots/util'
import checkpointPlotsFixture from '../../../fixtures/expShow/checkpointPlots'
import plotsDiffFixture from '../../../fixtures/plotsDiff/output'
import expShowFixture from '../../../fixtures/expShow/output'
import { Operator } from '../../../../experiments/model/filterBy'
import { joinMetricOrParamPath } from '../../../../experiments/metricsAndParams/paths'
import {
  ExperimentItem,
  ExperimentsTree
} from '../../../../experiments/model/tree'
import { buildExperiments, buildSingleRepoExperiments } from '../util'
import { ResourceLocator } from '../../../../resourceLocator'
import { InternalCommands } from '../../../../commands/internal'
import { WEBVIEW_TEST_TIMEOUT } from '../../timeouts'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../../vscode/quickPick'
import { Response } from '../../../../vscode/response'
import { CliExecutor } from '../../../../cli/executor'
import { Param } from '../../../../experiments/model/queue/collect'
import { WorkspaceExperiments } from '../../../../experiments/workspace'
import { MetricOrParamType } from '../../../../experiments/webview/contract'

suite('Experiments Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsTree', () => {
    const { colors } = checkpointPlotsFixture
    const { domain, range } = colors

    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to toggle whether an experiment is shown in the plots webview with dvc.views.experimentsTree.toggleStatus', async () => {
      const { plots, messageSpy } = await buildPlots(disposable)

      const expectedDomain = [...domain]
      const expectedRange = [...range]

      const webview = await plots.showWebview()
      await webview.isReady()

      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      while (expectedDomain.length > 0) {
        const expectedData = getExpectedCheckpointPlotsData(
          expectedDomain,
          expectedRange
        )

        const { checkpoint } = getFirstArgOfLastCall(messageSpy)

        expect(
          { checkpoint },
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

        expect(unSelected).to.equal(Status.UNSELECTED)
        expect(
          setSelectionModeSpy,
          'de-selecting any experiment disables auto-apply filters to experiments selection'
        ).to.be.calledOnceWith(false)
        setSelectionModeSpy.resetHistory()
      }

      expect(
        messageSpy,
        'when there are no experiments selected we send null (show empty state)'
      ).to.be.calledWithMatch({
        checkpoint: null
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

      expect(selected, 'the experiment is now selected').to.equal(
        Status.SELECTED
      )

      expect(messageSpy, 'we no longer send null').to.be.calledWithMatch(
        getExpectedCheckpointPlotsData(expectedDomain, expectedRange)
      )
      expect(
        setSelectionModeSpy,
        'selecting any experiment disables auto-apply filters to experiments selection'
      ).to.be.calledOnceWith(false)
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

      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
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
        getExpectedCheckpointPlotsData([selectedDisplayName], [selectedColor])
      )
      expect(
        setSelectionModeSpy,
        'auto-apply filters to experiment selection is disabled'
      ).to.be.calledOnceWith(false)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to apply filters using dvc.views.experimentsTree.autoApplyFilters', async () => {
      const { plots, messageSpy } = await buildPlots(disposable)

      const unfilteredCheckpointValue = expShowFixture[
        '53c3851f46955fa3e2b8f6e1c52999acc8c9ea77'
      ].d1343a87c6ee4a2e82d19525964d2fb2cb6756c9.data?.metrics?.['summary.json']
        .data?.loss as number

      const selectedDisplayName = domain[0]
      const selectedColor = range[0]

      await plots.showWebview()
      messageSpy.resetHistory()

      stub(ExperimentsModel.prototype, 'getFilters').returns([
        {
          operator: Operator.EQUAL,
          path: joinMetricOrParamPath(
            MetricOrParamType.METRICS,
            'summary.json',
            'loss'
          ),
          value: unfilteredCheckpointValue
        }
      ])
      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_AUTO_APPLY_FILTERS
      )

      expect(
        messageSpy,
        'the filter is applied and one experiment remains because of a single checkpoint'
      ).to.be.calledWithMatch(
        getExpectedCheckpointPlotsData([selectedDisplayName], [selectedColor])
      )
      expect(
        setSelectionModeSpy,
        'auto-apply filters to experiment selection is enabled'
      ).to.be.calledOnceWith(true)
      messageSpy.resetHistory()
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should warn the user if enabling dvc.views.experimentsTree.autoApplyFilters would select too many experiments', async () => {
      const { plots, experiments, plotsModel, messageSpy, mockPlotsDiff } =
        await buildPlots(disposable, plotsDiffFixture)

      await plots.showWebview()
      const initiallySelectedRevisions = plotsModel.getSelectedRevisionDetails()

      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      stub(window, 'showWarningMessage')
        .onFirstCall()
        .resolves(Response.CANCEL as unknown as MessageItem)
        .onFirstCall()
        .resolves(Response.SELECT_MOST_RECENT as unknown as MessageItem)

      messageSpy.resetHistory()

      const firstUpdateEvent = experimentsUpdatedEvent(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_AUTO_APPLY_FILTERS
      )

      await firstUpdateEvent

      expect(
        getFirstArgOfLastCall(setSelectionModeSpy),
        'auto-apply filters to experiment selection is not enabled when the user selects to cancel'
      ).to.be.false
      expect(
        messageSpy,
        'the same experiments are still selected'
      ).to.be.calledWithMatch({
        comparison: {
          revisions: initiallySelectedRevisions
        }
      })
      setSelectionModeSpy.resetHistory()
      messageSpy.resetHistory()

      const secondUpdateEvent = experimentsUpdatedEvent(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_AUTO_APPLY_FILTERS
      )

      await secondUpdateEvent

      expect(
        getFirstArgOfLastCall(setSelectionModeSpy),
        'auto-apply filters to experiment selection is not enabled when the user selects to use the most recent'
      ).to.be.false
      expect(
        plotsModel.getSelectedRevisionDetails(),
        'all running and the most recent experiments are now selected'
      ).to.deep.equal([
        { displayColor: '#945dd6', revision: 'workspace' },
        { displayColor: '#f14c4c', revision: '4fb124a' },
        { displayColor: '#3794ff', revision: '42b8736' },
        { displayColor: '#f14c4c', revision: 'd1343a8' },
        { displayColor: '#f14c4c', revision: '1ee5f2e' },
        { displayColor: '#3794ff', revision: '2173124' },
        { displayColor: '#3794ff', revision: '9523bde' }
      ])
      expect(
        mockPlotsDiff,
        'the missing revisions have been requested'
      ).to.be.calledWithExactly(
        dvcDemoPath,
        '1ee5f2e',
        '2173124',
        '9523bde',
        'd1343a8'
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should automatically apply filters to experiments selection if dvc.experiments.filter.selected has been set via dvc.views.experimentsTree.autoApplyFilters', async () => {
      const { experiments, plots, messageSpy } = await buildPlots(disposable)
      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      await plots.showWebview()

      messageSpy.resetHistory()

      await addFilterViaQuickInput(experiments, {
        operator: Operator.EQUAL,
        path: joinMetricOrParamPath(
          MetricOrParamType.METRICS,
          'summary.json',
          'loss'
        ),
        value: '0'
      })

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_AUTO_APPLY_FILTERS
      )
      expect(setSelectionModeSpy).to.be.calledOnceWith(true)
      setSelectionModeSpy.resetHistory()

      const expectedMessage = {
        checkpoint: null,
        comparison: null,
        template: null
      }

      expect(
        messageSpy,
        'the filter is automatically applied and no experiment remains because every record has a loss'
      ).to.be.calledWithMatch(expectedMessage)
      messageSpy.resetHistory()

      const tableFilterRemoved = experimentsUpdatedEvent(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE_ALL
      )

      await tableFilterRemoved
      expect(
        setSelectionModeSpy,
        'auto-apply filters is automatically disabled when all filters are removed from the tree'
      ).to.be.calledOnceWith(false)

      expect(
        messageSpy,
        'the old filters are still applied to the message'
      ).to.be.calledWithMatch(expectedMessage)
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

      const experimentsTree = disposable.track(
        new ExperimentsTree(
          workspaceExperiments,
          { registerExternalCommand: stub() } as unknown as InternalCommands,
          {} as ResourceLocator
        )
      )

      const description = '[exp-1234]'

      const setExpandedSpy = spy(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experimentsTree as any,
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
      const mockExperiment = 'exp-to-remove'

      const mockExperimentRemove = stub(
        CliExecutor.prototype,
        'experimentRemove'
      ).resolves('')

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_TREE_REMOVE, {
        dvcRoot: dvcDemoPath,
        id: mockExperiment
      })

      expect(mockExperimentRemove).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperiment
      )
    })

    it('should be able to apply an experiment to the workspace with dvc.views.experimentsTree.applyExperiment', async () => {
      const mockExperiment = 'exp-to-apply'

      const mockExperimentApply = stub(
        CliExecutor.prototype,
        'experimentApply'
      ).resolves(
        `Changes for experiment '${mockExperiment}' have been applied to your current workspace.`
      )

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_TREE_APPLY, {
        dvcRoot: dvcDemoPath,
        id: mockExperiment
      })

      expect(mockExperimentApply).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperiment
      )
    })

    it('should not create a new branch from an experiment with dvc.views.experimentsTree.branchExperiment if the user cancels', async () => {
      const mockCheckpoint = 'a2c44b8'

      const mockExperimentBranch = stub(
        CliExecutor.prototype,
        'experimentBranch'
      )
      const mockShowInputBox = stub(window, 'showInputBox').resolves(undefined)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_TREE_BRANCH, {
        dvcRoot: dvcDemoPath,
        id: 'a2c44b889aca2b3e2dc6737852fa930f5980270e',
        label: mockCheckpoint,
        type: ExperimentType.CHECKPOINT
      })

      expect(mockShowInputBox).to.be.calledOnce
      expect(mockExperimentBranch).not.to.be.called
    })

    it('should be able to create a new branch from an experiment with dvc.views.experimentsTree.branchExperiment', async () => {
      const mockCheckpoint = 'a2c44b8'
      const mockBranch = 'it-is-a-branch'

      const mockExperimentBranch = stub(
        CliExecutor.prototype,
        'experimentBranch'
      ).resolves(
        `Git branch '${mockBranch}' has been created from experiment '${mockCheckpoint}'.        
       To switch to the new branch run:
             git checkout ${mockBranch}`
      )
      const mockShowInputBox = stub(window, 'showInputBox').resolves(mockBranch)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_TREE_BRANCH, {
        dvcRoot: dvcDemoPath,
        id: 'a2c44b889aca2b3e2dc6737852fa930f5980270e',
        label: mockCheckpoint,
        type: ExperimentType.CHECKPOINT
      })

      expect(mockShowInputBox).to.be.calledOnce
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        mockCheckpoint,
        mockBranch
      )
    })

    it('should be able to queue an experiment from an existing one with dvc.views.experimentsTree.queueExperiment', async () => {
      const baseExperimentId = 'workspace'

      const { experiments, experimentsModel } = buildExperiments(disposable)

      await experiments.isReady()

      const mockExperimentRunQueue = stub(
        CliExecutor.prototype,
        'experimentRunQueue'
      ).resolves('true')

      const mockGetOnlyOrPickProject = stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getOnlyOrPickProject'
      )
      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)

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

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_TREE_QUEUE, {
        dvcRoot: dvcDemoPath,
        id: baseExperimentId
      })

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
  })
})
