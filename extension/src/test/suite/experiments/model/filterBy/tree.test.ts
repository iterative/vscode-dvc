import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, MessageItem, EventEmitter, TreeView } from 'vscode'
import { addFilterViaQuickInput, mockQuickInputFilter } from './util'
import { Disposable } from '../../../../../extension'
import columnsFixture from '../../../../fixtures/expShow/columns'
import rowsFixture from '../../../../fixtures/expShow/rows'
import workspaceChangesFixture from '../../../../fixtures/expShow/workspaceChanges'
import { WorkspaceExperiments } from '../../../../../experiments/workspace'
import {
  getFilterId,
  Operator
} from '../../../../../experiments/model/filterBy'
import { buildMockMemento, dvcDemoPath } from '../../../../util'
import { experimentsUpdatedEvent } from '../../../util'
import { buildMetricOrParamPath } from '../../../../../experiments/columns/paths'
import { RegisteredCommands } from '../../../../../commands/external'
import { buildExperiments } from '../../util'
import {
  ColumnType,
  Experiment,
  TableData
} from '../../../../../experiments/webview/contract'
import { WEBVIEW_TEST_TIMEOUT } from '../../../timeouts'
import { Response } from '../../../../../vscode/response'
import {
  ExperimentsModel,
  ExperimentType
} from '../../../../../experiments/model'
import { Title } from '../../../../../vscode/title'
import {
  ExperimentsFilterByTree,
  FilterItem
} from '../../../../../experiments/model/filterBy/tree'

suite('Experiments Filter By Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('ExperimentsFilterByTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsFilterByTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to update the table data by adding and removing a filter', async () => {
      const { experiments, messageSpy } = buildExperiments(disposable)

      await experiments.isReady()
      await experiments.showWebview()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getFocusedOrOnlyOrPickProject'
      ).returns(dvcDemoPath)

      const accuracyPath = buildMetricOrParamPath(
        ColumnType.METRICS,
        'summary.json',
        'accuracy'
      )

      const accuracyFilter = {
        operator: Operator.GREATER_THAN_OR_EQUAL,
        path: accuracyPath,
        value: '0.45'
      }

      await addFilterViaQuickInput(experiments, accuracyFilter)

      const [workspace, main] = rowsFixture

      const filteredRows = [
        workspace,
        {
          ...main,
          subRows: main.subRows
            ?.filter(experiment => {
              const accuracy = experiment.metrics?.['summary.json']?.accuracy
              return !!(
                accuracy === undefined ||
                (accuracy && accuracy >= 0.45)
              )
            })
            .map(experiment =>
              experiment.queued || experiment.error
                ? experiment
                : {
                    ...experiment,
                    subRows: experiment.subRows?.filter(checkpoint => {
                      const accuracy =
                        checkpoint.metrics?.['summary.json']?.accuracy
                      return !!(
                        accuracy === undefined ||
                        (accuracy && accuracy >= 0.45)
                      )
                    })
                  }
            )
        }
      ]

      const filteredTableData: TableData = {
        changes: workspaceChangesFixture,
        columnOrder: [],
        columnWidths: {},
        columns: columnsFixture,
        filteredCounts: { checkpoints: 4, experiments: 1 },
        filters: [accuracyPath],
        hasCheckpoints: true,
        hasColumns: true,
        hasRunningExperiment: true,
        rows: filteredRows,
        sorts: []
      }

      expect(messageSpy).to.be.calledWith(filteredTableData)

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

      const unfilteredTableData: TableData = {
        changes: workspaceChangesFixture,
        columnOrder: [],
        columnWidths: {},
        columns: columnsFixture,
        filteredCounts: { checkpoints: 0, experiments: 0 },
        filters: [],
        hasCheckpoints: true,
        hasColumns: true,
        hasRunningExperiment: true,
        rows: [workspace, main],
        sorts: []
      }

      expect(messageSpy).to.be.calledWith(unfilteredTableData)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to remove all filters with dvc.views.experimentsFilterByTree.removeAllFilters', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockShowInputBox = stub(window, 'showInputBox')

      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getFocusedOrOnlyOrPickProject'
      ).returns(dvcDemoPath)

      const lossPath = buildMetricOrParamPath(
        ColumnType.METRICS,
        'summary.json',
        'loss'
      )

      await addFilterViaQuickInput(
        experiments,
        {
          operator: Operator.LESS_THAN,
          path: lossPath,
          value: '2'
        },
        mockShowQuickPick,
        mockShowInputBox
      )

      await addFilterViaQuickInput(
        experiments,
        {
          operator: Operator.GREATER_THAN,
          path: lossPath,
          value: '0'
        },
        mockShowQuickPick,
        mockShowInputBox
      )

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
            value: getFilterId({
              operator: Operator.LESS_THAN,
              path: lossPath,
              value: '2'
            })
          },
          {
            description: '> 0',
            label: lossPath,
            value: getFilterId({
              operator: Operator.GREATER_THAN,
              path: lossPath,
              value: '0'
            })
          }
        ],
        { canPickMany: true, title: Title.SELECT_FILTERS_TO_REMOVE }
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

    it('should prompt the user when auto-apply filters is enabled and removing a filter will select too many experiments', async () => {
      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      const filter = {
        operator: Operator.EQUAL,
        path: buildMetricOrParamPath(
          ColumnType.METRICS,
          'summary.json',
          'loss'
        ),
        value: '0'
      }
      const filterId = getFilterId(filter)

      stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (WorkspaceExperiments as any).prototype,
        'getFocusedOrOnlyOrPickProject'
      ).returns(dvcDemoPath)

      await addFilterViaQuickInput(experiments, filter)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_AUTO_APPLY_FILTERS
      )

      const setSelectionModeSpy = spy(
        ExperimentsModel.prototype,
        'setSelectionMode'
      )

      const mockShowWarningMessage = stub(window, 'showWarningMessage')
        .onFirstCall()
        .resolves(Response.CANCEL as unknown as MessageItem)
        .onSecondCall()
        .resolves(Response.TURN_OFF as unknown as MessageItem)

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTER_REMOVE,
        {
          dvcRoot: dvcDemoPath,
          id: filterId
        }
      )

      expect(
        mockShowWarningMessage,
        'no further action is taken when the user cancels'
      ).to.be.calledOnce
      expect(setSelectionModeSpy).not.to.be.called

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTER_REMOVE,
        {
          dvcRoot: dvcDemoPath,
          id: filterId
        }
      )

      expect(
        mockShowWarningMessage,
        'auto-apply filters is turned off when the user selects turn off'
      ).to.be.calledTwice
      expect(setSelectionModeSpy).to.be.calledOnce
      expect(setSelectionModeSpy).to.be.calledWith(false)
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

    it('should update the description when a filter is added or removed', async () => {
      const { experiments, experimentsModel, internalCommands } =
        buildExperiments(disposable)
      await experiments.isReady()

      const workspaceExperiments = disposable.track(
        new WorkspaceExperiments(
          internalCommands,
          disposable.track(new EventEmitter()),
          buildMockMemento(),
          { [dvcDemoPath]: experiments },
          disposable.track(new EventEmitter())
        )
      )
      disposable.track(
        experiments.onDidChangeExperiments(() =>
          workspaceExperiments.experimentsChanged.fire()
        )
      )

      const mockTreeView = {
        description: undefined,
        dispose: stub()
      } as unknown as TreeView<string | FilterItem>
      stub(window, 'createTreeView').returns(mockTreeView)

      stub(internalCommands, 'registerExternalCommand').returns(undefined)
      disposable.track(
        new ExperimentsFilterByTree(workspaceExperiments, internalCommands)
      )
      const getUpdateEvent = () =>
        new Promise(resolve =>
          disposable.track(
            workspaceExperiments.onDidChangeExperiments(() =>
              resolve(undefined)
            )
          )
        )

      const tableFilterAdded = getUpdateEvent()

      const filter = {
        operator: Operator.EQUAL,
        path: buildMetricOrParamPath(
          ColumnType.METRICS,
          'summary.json',
          'loss'
        ),
        value: '0'
      }

      mockQuickInputFilter(filter)
      experiments.addFilter()
      await tableFilterAdded

      expect(mockTreeView.description).to.equal(
        '3 Experiments, 9 Checkpoints Filtered'
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(experimentsModel as any, 'getFilteredExperiments')
        .onFirstCall()
        .returns([
          { id: '0ef13xs', type: ExperimentType.CHECKPOINT } as Experiment & {
            type: ExperimentType
          }
        ])
        .onSecondCall()
        .returns([
          { id: 'exp-1', type: ExperimentType.EXPERIMENT } as Experiment & {
            type: ExperimentType
          }
        ])
        .onThirdCall()
        .returns([
          { id: 'exp-1', type: ExperimentType.EXPERIMENT } as Experiment & {
            type: ExperimentType
          },
          { id: 'exp-2', type: ExperimentType.EXPERIMENT } as Experiment & {
            type: ExperimentType
          },
          { id: 'exp-3', type: ExperimentType.EXPERIMENT } as Experiment & {
            type: ExperimentType
          }
        ])

      const allButOneCheckpointFilteredEvent = getUpdateEvent()
      workspaceExperiments.experimentsChanged.fire()
      await allButOneCheckpointFilteredEvent

      expect(mockTreeView.description).to.equal(
        '0 Experiments, 1 Checkpoint Filtered'
      )

      const allButOneExperimentFilteredEvent = getUpdateEvent()
      workspaceExperiments.experimentsChanged.fire()
      await allButOneExperimentFilteredEvent

      expect(mockTreeView.description).to.equal(
        '1 Experiment, 0 Checkpoints Filtered'
      )

      const tableFilterRemoved = getUpdateEvent()
      experiments.removeFilter(getFilterId(filter))

      await tableFilterRemoved

      expect(mockTreeView.description).to.be.undefined
    })
  })
})
