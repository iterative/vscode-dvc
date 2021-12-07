import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, SinonStub, spy } from 'sinon'
import { commands, QuickPickItem, QuickPickOptions, window } from 'vscode'
import { Disposable } from '../../../../extension'
import { ExperimentsModel, Status } from '../../../../experiments/model'
import { experimentsUpdatedEvent } from '../../util'
import { dvcDemoPath } from '../../../util'
import { RegisteredCommands } from '../../../../commands/external'
import { buildPlots, getExpectedLivePlotsData } from '../../plots/util'
import livePlotsFixture from '../../../fixtures/expShow/livePlots'
import expShowFixture from '../../../fixtures/expShow/output'
import columnsFixture from '../../../fixtures/expShow/columns'
import { Operator } from '../../../../experiments/model/filterBy'
import { joinParamOrMetricPath } from '../../../../experiments/paramsAndMetrics/paths'

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
    const ids = [
      '4fb124aebddb2adf1545030907687fa9a4c80e70',
      '42b8736b08170529903cd203a1f40382a4b4a8cd',
      '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d'
    ]
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
      const expectedIds = [...ids]

      await plots.showWebview()
      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      while (expectedDomain.length) {
        const expectedData = getExpectedLivePlotsData(
          expectedDomain,
          expectedRange
        )

        expect(
          messageSpy,
          'a message is sent with colors for the currently selected experiments'
        ).to.be.calledWith(
          expectedDomain.length === 3
            ? {
                ...expectedData,
                static: null
              }
            : expectedData
        )
        messageSpy.resetHistory()

        const id = expectedIds.pop()
        expectedDomain.pop()
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
          id: ids[0]
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
    }).timeout(8000)

    it('should be able to select / de-select experiments using dvc.views.experimentsTree.selectExperiments', async () => {
      const { plots, messageSpy } = await buildPlots(disposable)

      const selectedId = ids[0]

      const selectedDisplayName = domain[0]
      const selectedColor = range[0]
      const selectedItem = {
        label: selectedDisplayName,
        picked: true,
        value: selectedId
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
      expect(mockShowQuickPick).to.be.calledWith(
        [
          {
            label: selectedDisplayName,
            picked: true,
            value: selectedId
          },
          {
            label: domain[1],
            picked: true,
            value: ids[1]
          },
          {
            label: domain[2],
            picked: true,
            value: ids[2]
          }
        ],
        { canPickMany: true, title: 'Select experiments' }
      )

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
    }).timeout(8000)

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
          path: joinParamOrMetricPath('metrics', 'summary.json', 'loss'),
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
    }).timeout(8000)

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

      const lossPath = joinParamOrMetricPath('metrics', 'summary.json', 'loss')

      const lossFilter = {
        operator: Operator.EQUAL,
        path: lossPath,
        value: '0'
      }

      const loss = columnsFixture.find(
        paramOrMetric => paramOrMetric.path === lossPath
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
    }).timeout(8000)
  })
})
