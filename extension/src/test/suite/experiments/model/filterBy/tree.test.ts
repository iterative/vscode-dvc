import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, QuickPickItem } from 'vscode'
import { Disposable } from '../../../../../extension'
import columnsFixture from '../../../../fixtures/expShow/columns'
import rowsFixture from '../../../../fixtures/expShow/rows'
import workspaceChangesFixture from '../../../../fixtures/expShow/workspaceChanges'
import { WorkspaceExperiments } from '../../../../../experiments/workspace'
import {
  getFilterId,
  Operator
} from '../../../../../experiments/model/filterBy'
import { dvcDemoPath, experimentsUpdatedEvent } from '../../../util'
import { joinParamOrMetricPath } from '../../../../../experiments/paramsAndMetrics/paths'
import { RegisteredCommands } from '../../../../../commands/external'
import { buildExperiments } from '../../util'
import { TableData } from '../../../../../experiments/webview/contract'

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

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()
      const experimentsWebview = await experiments.showWebview()
      const messageSpy = spy(experimentsWebview, 'show')

      const accuracyPath = joinParamOrMetricPath(
        'metrics',
        'summary.json',
        'accuracy'
      )

      const accuracyFilter = {
        operator: Operator.GREATER_THAN_OR_EQUAL,
        path: accuracyPath,
        value: '0.45'
      }

      const accuracy = columnsFixture.find(
        paramOrMetric => paramOrMetric.path === accuracyPath
      )
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: accuracy } as unknown as QuickPickItem)
      mockShowQuickPick.onSecondCall().resolves({
        value: accuracyFilter.operator
      } as unknown as QuickPickItem)
      mockShowInputBox.resolves(accuracyFilter.value)

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getFocusedOrOnlyOrPickProject'
      ).returns(dvcDemoPath)

      const tableFilterAdded = experimentsUpdatedEvent(experiments)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTER_ADD)

      await tableFilterAdded

      const [workspace, master] = rowsFixture

      const filteredRows = [
        workspace,
        {
          ...master,
          subRows: master.subRows
            ?.filter(experiment => {
              const accuracy = experiment.metrics?.['summary.json']?.accuracy
              return accuracy && accuracy >= 0.45
            })
            .map(experiment => ({
              ...experiment,
              subRows: experiment.subRows?.filter(checkpoint => {
                const accuracy = checkpoint.metrics?.['summary.json']?.accuracy
                return accuracy && accuracy >= 0.45
              })
            }))
        }
      ]

      expect(messageSpy).to.be.calledWith({
        data: {
          changes: workspaceChangesFixture,
          columns: columnsFixture,
          columnsOrder: [],
          rows: filteredRows,
          sorts: []
        }
      })

      const tableFilterRemoved = experimentsUpdatedEvent(experiments)

      messageSpy.resetHistory()

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTER_REMOVE,
        {
          description: accuracyPath,
          dvcRoot: dvcDemoPath,
          id: getFilterId(accuracyFilter),
          label: [accuracyFilter.operator, accuracyFilter.value].join(' ')
        }
      )
      await tableFilterRemoved

      const expectedTableData: TableData = {
        changes: workspaceChangesFixture,
        columns: columnsFixture,
        columnsOrder: [],
        rows: [workspace, master],
        sorts: []
      }

      expect(messageSpy).to.be.calledWith({
        data: expectedTableData
      })
    }).timeout(6000)

    it('should be able to remove all filters with dvc.views.experimentsFilterByTree.removeAllFilters', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockShowInputBox = stub(window, 'showInputBox')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      const lossPath = joinParamOrMetricPath('metrics', 'summary.json', 'loss')

      const loss = columnsFixture.find(
        paramOrMetric => paramOrMetric.path === lossPath
      )
      mockShowQuickPick
        .onFirstCall()
        .resolves({ value: loss } as unknown as QuickPickItem)
      mockShowQuickPick
        .onSecondCall()
        .resolves({ value: '<' } as unknown as QuickPickItem)
      mockShowInputBox.resolves('2')

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getFocusedOrOnlyOrPickProject'
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
      stub((WorkspaceExperiments as any).prototype, 'getDvcRoots').returns([
        dvcDemoPath
      ])
      stub(WorkspaceExperiments.prototype, 'isReady').resolves(undefined)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE_ALL
      )

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE
      )

      expect(mockShowInputBox).not.to.be.called
    })

    it('should handle the user exiting from the choose repository quick pick', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((WorkspaceExperiments as any).prototype, 'getDvcRoots').returns([
        dvcDemoPath,
        'mockRoot'
      ])

      const getRepositorySpy = spy(
        WorkspaceExperiments.prototype,
        'getRepository'
      )

      mockShowQuickPick.resolves(undefined)

      await commands.executeCommand(RegisteredCommands.EXPERIMENT_FILTER_ADD)

      expect(
        getRepositorySpy,
        'should not call get repository in addFilter without a root'
      ).not.to.be.called

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTERS_REMOVE
      )

      expect(
        getRepositorySpy,
        'should not call get repository in removeFilters without a root'
      ).not.to.be.called
    })
  })
})
