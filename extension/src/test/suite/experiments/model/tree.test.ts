import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, SinonStub, spy } from 'sinon'
import {
  commands,
  EventEmitter,
  QuickPickItem,
  QuickPickOptions,
  TreeView,
  TreeViewExpansionEvent,
  window
} from 'vscode'
import { Disposable } from '../../../../extension'
import { ExperimentsModel, Status } from '../../../../experiments/model'
import { experimentsUpdatedEvent, getFirstArgOfLastCall } from '../../util'
import { dvcDemoPath } from '../../../util'
import { RegisteredCommands } from '../../../../commands/external'
import { buildPlots, getExpectedLivePlotsData } from '../../plots/util'
import livePlotsFixture from '../../../fixtures/expShow/livePlots'
import expShowFixture from '../../../fixtures/expShow/output'
import columnsFixture from '../../../fixtures/expShow/columns'
import { Operator } from '../../../../experiments/model/filterBy'
import { joinMetricOrParamPath } from '../../../../experiments/metricsAndParams/paths'
import {
  ExperimentItem,
  ExperimentsTree
} from '../../../../experiments/model/tree'
import { buildSingleRepoExperiments } from '../util'
import { ResourceLocator } from '../../../../resourceLocator'
import { InternalCommands } from '../../../../commands/internal'

suite('Experiments Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsTree', () => {
    const { colors } = livePlotsFixture
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

      const mockGetLivePlots = stub(plotsModel, 'getLivePlots')
      const getLivePlotsEvent = new Promise(resolve =>
        mockGetLivePlots.callsFake(() => {
          resolve(undefined)
          return mockGetLivePlots.wrappedMethod.bind(plotsModel)()
        })
      )

      await plots.showWebview()
      await getLivePlotsEvent

      mockGetLivePlots.restore()

      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      while (expectedDomain.length) {
        const expectedData = getExpectedLivePlotsData(
          expectedDomain,
          expectedRange
        )

        const { live } = getFirstArgOfLastCall(messageSpy)

        expect(
          { live },
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
          'de-selecting any experiment disables auto apply filters to experiments selection'
        ).to.be.calledOnceWith(false)
        setSelectionModeSpy.resetHistory()
      }

      expect(
        messageSpy,
        'when there are no experiments selected we send undefined (show empty state)'
      ).to.be.calledWith({
        live: null
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
        getExpectedLivePlotsData(expectedDomain, expectedRange)
      )
      expect(
        setSelectionModeSpy,
        'selecting any experiment disables auto apply filters to experiments selection'
      ).to.be.calledOnceWith(false)
    }).timeout(12000)

    it('should be able to select / de-select experiments using dvc.views.experimentsTree.selectExperiments', async () => {
      const { plots, messageSpy } = await buildPlots(disposable)

      const selectedDisplayName = domain[0]
      const selectedColor = range[0]
      const selectedItem = {
        description: selectedDisplayName,
        label: '',
        picked: true,
        value: { id: selectedDisplayName }
      }

      await plots.showWebview()

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [
          items: readonly QuickPickItem[],
          options: QuickPickOptions & { canPickMany: true }
        ],
        Thenable<QuickPickItem[] | undefined>
      >
      mockShowQuickPick.resolves([selectedItem])
      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_SELECT)

      expect(mockShowQuickPick).to.be.calledOnce

      expect(
        messageSpy,
        'a message is sent with colors for the currently selected experiments'
      ).to.be.calledWith(
        getExpectedLivePlotsData([selectedDisplayName], [selectedColor])
      )
      expect(
        setSelectionModeSpy,
        'auto apply filters to experiment selection is disabled'
      ).to.be.calledOnceWith(false)
    }).timeout(12000)

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
        getExpectedLivePlotsData([selectedDisplayName], [selectedColor])
      )
      expect(
        setSelectionModeSpy,
        'auto apply filters to experiment selection is enabled'
      ).to.be.calledOnceWith(true)
      messageSpy.resetHistory()
    }).timeout(12000)

    it('should automatically apply filters to experiments selection if dvc.experiments.filter.selected has been set via dvc.views.experimentsTree.autoApplyFilters', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockShowInputBox = stub(window, 'showInputBox')
      const { experiments, plots, messageSpy } = await buildPlots(disposable)
      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      await plots.showWebview()
      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_AUTO_APPLY_FILTERS
      )
      expect(setSelectionModeSpy).to.be.calledOnceWith(true)
      setSelectionModeSpy.resetHistory()

      messageSpy.resetHistory()

      const lossPath = joinMetricOrParamPath('metrics', 'summary.json', 'loss')

      const lossFilter = {
        operator: Operator.EQUAL,
        path: lossPath,
        value: '0'
      }

      const loss = columnsFixture.find(
        metricOrParam => metricOrParam.path === lossPath
      )
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick.onSecondCall().resolves({
        value: lossFilter.operator
      } as unknown as QuickPickItem)
      mockShowInputBox.resolves(lossFilter.value)

      const tableFilterAdded = experimentsUpdatedEvent(experiments)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTER_ADD)

      await tableFilterAdded

      const expectedMessage = {
        live: null
      }

      expect(
        messageSpy,
        'the filter is automatically applied and no experiment remains because every record has a loss'
      ).to.be.calledWith(expectedMessage)
      messageSpy.resetHistory()

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_DISABLE_AUTO_APPLY_FILTERS
      )
      expect(setSelectionModeSpy).to.be.calledOnceWith(false)

      const tableFilterRemoved = experimentsUpdatedEvent(experiments)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE_ALL
      )

      await tableFilterRemoved

      expect(
        messageSpy,
        'the old filters are still applied to the message'
      ).to.be.calledWith(expectedMessage)
    }).timeout(12000)

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
