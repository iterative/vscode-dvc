import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import {
  commands,
  EventEmitter,
  MessageItem,
  QuickPick,
  TreeView,
  TreeViewExpansionEvent,
  window
} from 'vscode'
import { addFilterViaQuickInput } from './filterBy/util'
import { Disposable } from '../../../../extension'
import { ExperimentsModel } from '../../../../experiments/model'
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
import { buildSingleRepoExperiments } from '../util'
import { ResourceLocator } from '../../../../resourceLocator'
import { InternalCommands } from '../../../../commands/internal'
import { WEBVIEW_TEST_TIMEOUT } from '../../timeouts'
import { QuickPickItemWithValue } from '../../../../vscode/quickPick'
import { Response } from '../../../../vscode/response'

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
      const { plots, plotsModel, messageSpy } = await buildPlots(disposable)

      const expectedDomain = [...domain]
      const expectedRange = [...range]

      const mockGetCheckpointPlots = stub(plotsModel, 'getCheckpointPlots')
      const getCheckpointPlotsEvent = new Promise(resolve =>
        mockGetCheckpointPlots.callsFake(() => {
          resolve(undefined)
          return mockGetCheckpointPlots.wrappedMethod.bind(plotsModel)()
        })
      )

      await plots.showWebview()
      await getCheckpointPlotsEvent

      mockGetCheckpointPlots.restore()

      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      while (expectedDomain.length) {
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
        'when there are no experiments selected we send undefined (show empty state)'
      ).to.be.calledWith({
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

      expect(messageSpy, 'we no longer send undefined').to.be.calledWith(
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
      ).to.be.calledWith(
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
          path: joinMetricOrParamPath('metrics', 'summary.json', 'loss'),
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
      ).to.be.calledWith(
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
        path: joinMetricOrParamPath('metrics', 'summary.json', 'loss'),
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
      ).to.be.calledWith(expectedMessage)
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
      ).to.be.calledWith(expectedMessage)
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
  })
})
