import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, QuickPickItem } from 'vscode'
import { Disposable } from '../../../../../extension'
import complexColumnData from '../../../../fixtures/complex-column-example'
import complexRowData from '../../../../fixtures/complex-row-example'
import { Experiments } from '../../../../../experiments'
import {
  getFilterId,
  Operator
} from '../../../../../experiments/model/filterBy'
import { dvcDemoPath, experimentsUpdatedEvent } from '../../../util'
import { joinParamOrMetricPath } from '../../../../../experiments/paramsAndMetrics/paths'
import { RegisteredCommands } from '../../../../../commands/external'
import { buildExperimentsRepository } from '../../util'

suite('Experiments Filter By Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsFilterByTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsFilterByTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to update the table data by adding and removing a filter', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockShowInputBox = stub(window, 'showInputBox')

      const { experimentsRepository } = buildExperimentsRepository(disposable)

      await experimentsRepository.isReady()
      const experimentsWebview = await experimentsRepository.showWebview()
      const messageSpy = spy(experimentsWebview, 'showExperiments')

      const lossPath = joinParamOrMetricPath('metrics', 'summary.json', 'loss')

      const lossFilter = {
        operator: Operator.LESS_THAN_OR_EQUAL,
        path: lossPath,
        value: '1.6170'
      }

      const loss = complexColumnData.find(
        paramOrMetric => paramOrMetric.path === lossPath
      )
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: lossFilter.operator } as unknown as QuickPickItem)
      mockShowInputBox.resolves(lossFilter.value)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Experiments as any).prototype,
        'getFocusedOrDefaultOrPickProject'
      ).returns(dvcDemoPath)

      const tableFilterAdded = experimentsUpdatedEvent(experimentsRepository)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTER_ADD)

      await tableFilterAdded

      const [workspace, testBranch, master] = complexRowData

      const filteredRows = [
        workspace,
        {
          ...testBranch,
          subRows: testBranch.subRows?.map(experiment => ({
            ...experiment,
            subRows: experiment.subRows?.filter(checkpoint => {
              const loss = checkpoint.metrics?.['summary.json']?.loss
              return loss && loss <= 1.617
            })
          }))
        },
        { ...master, subRows: [] }
      ]

      expect(messageSpy).to.be.calledWith({
        tableData: {
          columns: complexColumnData,
          rows: filteredRows,
          sorts: []
        }
      })

      const tableFilterRemoved = experimentsUpdatedEvent(experimentsRepository)

      messageSpy.resetHistory()

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTER_REMOVE,
        {
          description: lossPath,
          dvcRoot: dvcDemoPath,
          id: getFilterId(lossFilter),
          label: [lossFilter.operator, lossFilter.value].join(' ')
        }
      )
      await tableFilterRemoved

      expect(messageSpy).to.be.calledWith({
        tableData: {
          columns: complexColumnData,
          rows: complexRowData,
          sorts: []
        }
      })
    })

    it('should be able to remove all filters with dvc.views.experimentsFilterByTree.removeAllFilters', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockShowInputBox = stub(window, 'showInputBox')

      const { experimentsRepository } = buildExperimentsRepository(disposable)

      await experimentsRepository.isReady()

      const lossPath = joinParamOrMetricPath('metrics', 'summary.json', 'loss')

      const loss = complexColumnData.find(
        paramOrMetric => paramOrMetric.path === lossPath
      )
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: '<' } as unknown as QuickPickItem)
      mockShowInputBox.resolves('2')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getRepository').returns(
        experimentsRepository
      )
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Experiments as any).prototype,
        'getFocusedOrDefaultOrPickProject'
      ).returns(dvcDemoPath)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTER_ADD)

      mockShowQuickPick.resetHistory()
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: '>' } as unknown as QuickPickItem)
      mockShowInputBox.resolves('0')

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTER_ADD)

      mockShowQuickPick.resetHistory()
      mockShowQuickPick.onFirstCall().resolves(undefined)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE
      )

      expect(mockShowQuickPick).to.be.calledWith(
        [
          {
            description: '< 2',
            label: lossPath,
            value: { operator: '<', path: lossPath, value: '2' }
          },
          {
            description: '> 0',
            label: lossPath,
            value: { operator: '>', path: lossPath, value: '0' }
          }
        ],
        { canPickMany: true, title: 'Select filter(s) to remove' }
      )

      mockShowInputBox.resetHistory()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((Experiments as any).prototype, 'getDvcRoots').returns([dvcDemoPath])
      stub(Experiments.prototype, 'isReady').resolves(undefined)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE_ALL
      )

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE
      )

      expect(mockShowInputBox).not.to.be.called
    })
  })

  it('should handle the user exiting from the choose repository quick pick', async () => {
    const mockShowQuickPick = stub(window, 'showQuickPick')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub((Experiments as any).prototype, 'getDvcRoots').returns([
      dvcDemoPath,
      'mockRoot'
    ])

    const getRepositorySpy = spy(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Experiments as any).prototype,
      'getRepository'
    )

    mockShowQuickPick.resolves(undefined)

    await commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTER_ADD)

    expect(
      getRepositorySpy,
      'should not call get repository in addFilter without a root'
    ).not.to.be.called

    await commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTERS_REMOVE)

    expect(
      getRepositorySpy,
      'should not call get repository in removeFilters without a root'
    ).not.to.be.called
  })
})
