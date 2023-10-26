import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
import { window, commands, EventEmitter, TreeView } from 'vscode'
import { addFilterViaQuickInput, mockQuickInputFilter } from './util'
import { Disposable } from '../../../../../extension'
import columnsFixture, {
  dataColumnOrder as columnsOrderFixture
} from '../../../../fixtures/expShow/base/columns'
import rowsFixture from '../../../../fixtures/expShow/base/rows'
import workspaceChangesFixture from '../../../../fixtures/expShow/base/workspaceChanges'
import { WorkspaceExperiments } from '../../../../../experiments/workspace'
import {
  getFilterId,
  Operator
} from '../../../../../experiments/model/filterBy'
import { buildMockMemento, dvcDemoPath } from '../../../../util'
import {
  closeAllEditors,
  experimentsUpdatedEvent,
  stubPrivateMethod,
  stubPrivatePrototypeMethod,
  waitForSpyCall
} from '../../../util'
import { buildMetricOrParamPath } from '../../../../../experiments/columns/paths'
import { RegisteredCommands } from '../../../../../commands/external'
import {
  buildExperiments,
  stubWorkspaceGetters,
  stubWorkspaceGettersWebview
} from '../../util'
import {
  ColumnType,
  TableData
} from '../../../../../experiments/webview/contract'
import { WEBVIEW_TEST_TIMEOUT } from '../../../timeouts'
import { Title } from '../../../../../vscode/title'
import {
  ExperimentsFilterByTree,
  FilterItem
} from '../../../../../experiments/model/filterBy/tree'
import { starredFilter } from '../../../../../experiments/model/filterBy/constants'
import {
  Value,
  ValueTree,
  FileDataOrError
} from '../../../../../cli/dvc/contract'
import { tagsColumnLike } from '../../../../../experiments/columns/like'

suite('Experiments Filter By Tree Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return closeAllEditors()
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('ExperimentsFilterByTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.experimentsFilterByTree.focus')
      ).to.be.eventually.equal(undefined)
    })

    it('should be able to update the table data by adding and removing a filter', async () => {
      const { experiments, messageSpy } =
        await stubWorkspaceGettersWebview(disposable)

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

      const messageSent = waitForSpyCall(messageSpy, messageSpy.callCount)
      await addFilterViaQuickInput(experiments, accuracyFilter)

      const [workspace, main, fe2919b, _7df876c] = rowsFixture

      const gte45 = (value: FileDataOrError | ValueTree | Value): boolean =>
        !!(value && typeof value === 'number' && value >= 0.45)

      const filteredRows = [
        workspace,
        {
          ...main,
          subRows: main.subRows?.filter(experiment => {
            const accuracy = experiment.metrics?.['summary.json']?.accuracy
            return !!(accuracy === undefined || gte45(accuracy))
          })
        }
      ]

      const filteredTableData: Partial<TableData> = {
        changes: workspaceChangesFixture,
        filters: [accuracyPath],
        rows: filteredRows
      }
      await messageSent

      expect(messageSpy).to.be.calledWithMatch(filteredTableData)

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

      const unfilteredTableData: Partial<TableData> = {
        changes: workspaceChangesFixture,
        columns: columnsFixture,
        filters: [],
        rows: [workspace, main, fe2919b, _7df876c]
      }

      expect(messageSpy).to.be.calledWithMatch(unfilteredTableData)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to remove all filters with dvc.views.experimentsFilterByTree.removeAllFilters', async () => {
      const { experiments } = await stubWorkspaceGetters(disposable)

      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockShowInputBox = stub(window, 'showInputBox')

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
        {
          canPickMany: true,
          matchOnDescription: true,
          matchOnDetail: true,
          title: Title.SELECT_FILTERS_TO_REMOVE
        }
      )

      mockShowInputBox.resetHistory()

      stubPrivatePrototypeMethod(WorkspaceExperiments, 'getDvcRoots').returns([
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

      stub(WorkspaceExperiments.prototype, 'getDvcRoots').returns([
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
        buildExperiments({ disposer: disposable })
      await experiments.isReady()

      const workspaceExperiments = disposable.track(
        new WorkspaceExperiments(
          internalCommands,
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
      void experiments.addFilter()
      await tableFilterAdded

      expect(mockTreeView.description).to.equal('5 of 11 Filtered')

      stubPrivateMethod(experimentsModel, 'getFilteredExperiments')
        .onFirstCall()
        .returns([{ id: '0ef13xs' }])
        .onSecondCall()
        .returns([{ id: 'exp-1' }, { id: 'exp-2' }, { id: 'exp-3' }])
        .onThirdCall()
        .returns([])

      const allButOneExperimentFilteredEvent = getUpdateEvent()
      workspaceExperiments.experimentsChanged.fire()
      await allButOneExperimentFilteredEvent

      expect(mockTreeView.description).to.equal('1 of 11 Filtered')

      const threeExperimentsFilteredEvent = getUpdateEvent()
      workspaceExperiments.experimentsChanged.fire()
      await threeExperimentsFilteredEvent

      expect(mockTreeView.description).to.equal('3 of 11 Filtered')

      const tableFilterRemoved = getUpdateEvent()
      experiments.removeFilter(getFilterId(filter))

      await tableFilterRemoved

      expect(mockTreeView.description).to.be.undefined
    })

    it('should be able to filter to starred experiments', async () => {
      const { experiments, experimentsModel, messageSpy } =
        await stubWorkspaceGettersWebview(disposable)

      experimentsModel.toggleStars(['main'])

      const messageSent = waitForSpyCall(messageSpy, messageSpy.callCount)
      await addFilterViaQuickInput(experiments, starredFilter)

      const [workspace, main] = rowsFixture

      const mainNoSubRows = { ...main }
      delete mainNoSubRows.subRows
      mainNoSubRows.starred = true

      const filteredRows = [workspace, mainNoSubRows]

      const filteredTableData: Partial<TableData> = {
        changes: workspaceChangesFixture,
        columnOrder: columnsOrderFixture,
        columns: columnsFixture,
        filters: ['starred'],
        rows: filteredRows
      }

      await messageSent
      expect(messageSpy).to.be.calledWithMatch(filteredTableData)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to filter to tagged commits', async () => {
      const { experiments, messageSpy } =
        await stubWorkspaceGettersWebview(disposable)

      const messageSent = waitForSpyCall(messageSpy, messageSpy.callCount)
      await addFilterViaQuickInput(experiments, {
        operator: Operator.CONTAINS,
        path: tagsColumnLike.path,
        value: '9.3'
      })

      const [workspace, main] = rowsFixture

      const mainNoSubRows = { ...main }
      delete mainNoSubRows.subRows

      const filteredRows = [workspace, mainNoSubRows]

      const filteredTableData: Partial<TableData> = {
        changes: workspaceChangesFixture,
        columnOrder: columnsOrderFixture,
        columns: columnsFixture,
        filters: ['Git Tag'],
        rows: filteredRows
      }

      await messageSent
      expect(messageSpy).to.be.calledWithMatch(filteredTableData)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should provide a shortcut to filter to starred experiments', async () => {
      const { experimentsModel } = await stubWorkspaceGetters(disposable)

      const mockAddFilter = stub(experimentsModel, 'addFilter')

      await commands.executeCommand(
        RegisteredCommands.EXPERIMENT_FILTER_ADD_STARRED
      )

      expect(mockAddFilter).to.be.calledWith(starredFilter)
    })
  })
})
