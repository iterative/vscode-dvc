import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore, match } from 'sinon'
import { EventEmitter, window, commands, workspace, Uri } from 'vscode'
import { buildExperiments } from './util'
import { Disposable } from '../../../extension'
import expShowFixture from '../../fixtures/expShow/output'
import rowsFixture from '../../fixtures/expShow/rows'
import columnsFixture from '../../fixtures/expShow/columns'
import workspaceChangesFixture from '../../fixtures/expShow/workspaceChanges'
import { Experiments } from '../../../experiments'
import { ResourceLocator } from '../../../resourceLocator'
import { QuickPickItemWithValue } from '../../../vscode/quickPick'
import { MetricOrParam, TableData } from '../../../experiments/webview/contract'
import {
  buildInternalCommands,
  buildMockData,
  closeAllEditors,
  experimentsUpdatedEvent,
  extensionUri
} from '../util'
import { buildMockMemento, dvcDemoPath } from '../../util'
import { SortDefinition } from '../../../experiments/model/sortBy'
import { FilterDefinition, Operator } from '../../../experiments/model/filterBy'
import * as FilterQuickPicks from '../../../experiments/model/filterBy/quickPick'
import * as SortQuickPicks from '../../../experiments/model/sortBy/quickPick'
import { joinMetricOrParamPath } from '../../../experiments/metricsAndParams/paths'
import { BaseWebview } from '../../../webview'
import { MetricsAndParamsModel } from '../../../experiments/metricsAndParams/model'
import * as Factory from '../../../webview/factory'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from '../../../webview/contract'
import { ExperimentsModel } from '../../../experiments/model'
import {
  copyOriginalBranchColors,
  copyOriginalExperimentColors,
  getWorkspaceColor
} from '../../../experiments/model/colors'
import { InternalCommands } from '../../../commands/internal'

suite('Experiments Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return closeAllEditors()
  })

  describe('getExperiments', () => {
    it('should return all existing experiments', async () => {
      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      const runs = experiments.getExperiments()

      expect(runs.map(experiment => experiment.displayId)).to.deep.equal([
        'workspace',
        '4fb124a',
        '42b8736',
        '1ba7bcd',
        '90aea7f'
      ])
    })
  })

  describe('getCheckpoints', () => {
    it("should return the correct checkpoints for an experiment's id", async () => {
      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      const notAnExperimentId = ':cartwheel:'
      const notCheckpoints = experiments.getCheckpoints(notAnExperimentId)
      expect(notCheckpoints).to.be.undefined

      const checkpoints = experiments.getCheckpoints(
        '4fb124aebddb2adf1545030907687fa9a4c80e70'
      )

      expect(
        checkpoints?.map(checkpoint => checkpoint.displayId)
      ).to.deep.equal(['d1343a8', '1ee5f2e'])
    })
  })

  describe('showWebview', () => {
    it('should be able to make the experiment webview visible', async () => {
      const { experiments, messageSpy } = buildExperiments(
        disposable,
        expShowFixture
      )

      const webview = await experiments.showWebview()

      const expectedTableData: TableData = {
        changes: workspaceChangesFixture,
        columnOrder: [],
        columnWidths: {},
        columns: columnsFixture,
        rows: rowsFixture,
        sorts: []
      }

      expect(messageSpy).to.be.calledWith(expectedTableData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(8000)

    it('should only be able to open a single experiments webview', async () => {
      const { experiments } = buildExperiments(disposable)

      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(dvcDemoPath, 'train.py'))

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const webview = await experiments.showWebview()

      expect(windowSpy).to.have.been.calledOnce

      windowSpy.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const sameWebview = await experiments.showWebview()

      expect(webview === sameWebview).to.be.true

      expect(windowSpy).not.to.have.been.called
    }).timeout(8000)

    it('should handle column reordering messages from the webview', async () => {
      const { experiments } = buildExperiments(disposable, expShowFixture)

      const mockMessageReceived = disposable.track(
        new EventEmitter<MessageFromWebview>()
      )

      const onDidReceiveMessage = mockMessageReceived.event

      stub(Factory, 'createWebview').resolves({
        dispose: stub(),
        isReady: () => Promise.resolve(),
        onDidChangeIsFocused: stub(),
        onDidDispose: stub(),
        onDidReceiveMessage,
        show: stub()
      } as unknown as BaseWebview<TableData>)

      await experiments.showWebview()

      const columnOrder = [
        'id',
        'timestamp',
        'params:params.yaml:lr',
        'metrics:logs.json:step',
        'params:params.yaml:weight_decay',
        'metrics:logs.json:loss',
        'params:params.yaml:seed',
        'metrics:logs.json:acc'
      ]

      const mockSetColumnReordered = stub(
        MetricsAndParamsModel.prototype,
        'setColumnOrder'
      )

      const columnOrderSet = new Promise(resolve =>
        mockSetColumnReordered.callsFake(() => resolve(undefined))
      )

      mockMessageReceived.fire({
        payload: columnOrder,
        type: MessageFromWebviewType.COLUMN_REORDERED
      })

      await columnOrderSet

      expect(mockSetColumnReordered).to.be.calledWith(columnOrder)
    }).timeout(8000)

    it('should be able to sort', async () => {
      const { internalCommands } = buildInternalCommands(disposable)

      const buildTestExperiment = (testParam: number) => ({
        params: {
          'params.yaml': {
            data: { test: testParam }
          }
        }
      })

      const messageSpy = spy(BaseWebview.prototype, 'show')

      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ExperimentsModel.prototype as any,
        'getAssignedExperimentColors'
      ).returns(new Map())

      const updatesPaused = disposable.track(new EventEmitter<boolean>())

      const resourceLocator = disposable.track(
        new ResourceLocator(extensionUri)
      )

      const experiments = disposable.track(
        new Experiments(
          dvcDemoPath,
          internalCommands,
          updatesPaused,
          resourceLocator,
          buildMockMemento(),
          buildMockData()
        )
      )

      experiments.setState({
        testBranch: {
          baseline: {
            data: { name: 'testBranch', ...buildTestExperiment(10) }
          },
          testExp1: { data: buildTestExperiment(2) },
          testExp2: { data: buildTestExperiment(1) },
          testExp3: { data: buildTestExperiment(3) }
        },
        workspace: {
          baseline: { data: buildTestExperiment(10) }
        }
      })

      messageSpy.resetHistory()

      await experiments.isReady()
      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        rows: [
          {
            displayColor: getWorkspaceColor(),
            displayId: 'workspace',
            id: 'workspace',
            params: { 'params.yaml': { test: 10 } }
          },
          {
            displayColor: '#13adc7',
            displayId: 'testBranch',
            id: 'testBranch',
            name: 'testBranch',
            params: { 'params.yaml': { test: 10 } },
            subRows: [
              {
                displayId: 'testExp',
                id: 'testExp1',
                params: { 'params.yaml': { test: 2 } }
              },
              {
                displayId: 'testExp',
                id: 'testExp2',
                params: { 'params.yaml': { test: 1 } }
              },
              {
                displayId: 'testExp',
                id: 'testExp3',
                params: { 'params.yaml': { test: 3 } }
              }
            ]
          }
        ],
        sorts: []
      })

      const mockShowQuickPick = stub(window, 'showQuickPick')
      const sortPath = joinMetricOrParamPath('params', 'params.yaml', 'test')

      mockShowQuickPick.onFirstCall().resolves({
        label: 'test',
        value: {
          path: sortPath
        }
      } as QuickPickItemWithValue<MetricOrParam>)

      mockShowQuickPick.onSecondCall().resolves({
        label: 'Ascending',
        value: false
      } as QuickPickItemWithValue<boolean>)

      const tableChangePromise = experimentsUpdatedEvent(experiments)

      messageSpy.resetHistory()

      const pickPromise = experiments.addSort()
      await pickPromise
      await tableChangePromise

      expect(messageSpy).to.be.calledWithMatch({
        rows: [
          {
            displayColor: getWorkspaceColor(),
            displayId: 'workspace',
            id: 'workspace',
            params: { 'params.yaml': { test: 10 } }
          },
          {
            displayColor: '#13adc7',
            displayId: 'testBranch',
            id: 'testBranch',
            name: 'testBranch',
            params: { 'params.yaml': { test: 10 } },
            subRows: [
              {
                displayId: 'testExp',
                id: 'testExp2',
                params: { 'params.yaml': { test: 1 } }
              },
              {
                displayId: 'testExp',
                id: 'testExp1',
                params: { 'params.yaml': { test: 2 } }
              },
              {
                displayId: 'testExp',
                id: 'testExp3',
                params: { 'params.yaml': { test: 3 } }
              }
            ]
          }
        ],
        sorts: [{ descending: false, path: sortPath }]
      })
    }).timeout(8000)
  })

  describe('persisted state', () => {
    const firstSortDefinition = {
      descending: false,
      path: joinMetricOrParamPath('params', 'params.yaml', 'test')
    }
    const secondSortDefinition = {
      descending: true,
      path: joinMetricOrParamPath('params', 'params.yaml', 'other')
    }
    const sortDefinitions: SortDefinition[] = [
      firstSortDefinition,
      secondSortDefinition
    ]

    const firstFilterId = joinMetricOrParamPath(
      'params',
      'params.yaml',
      'test==1'
    )
    const firstFilterDefinition = {
      operator: Operator.EQUAL,
      path: joinMetricOrParamPath('params', 'params.yaml', 'test'),
      value: 1
    }
    const secondFilterId = joinMetricOrParamPath(
      'params',
      'params.yaml',
      'other∈testcontains'
    )
    const secondFilterDefinition = {
      operator: Operator.CONTAINS,
      path: joinMetricOrParamPath('params', 'params.yaml', 'other'),
      value: 'testcontains'
    }
    const firstFilterMapEntry: [string, FilterDefinition] = [
      firstFilterId,
      firstFilterDefinition
    ]
    const secondFilterMapEntry: [string, FilterDefinition] = [
      secondFilterId,
      secondFilterDefinition
    ]
    const filterMapEntries = [firstFilterMapEntry, secondFilterMapEntry]

    it('should initialize given no persisted state and update persistence given any change', async () => {
      const expectedExperimentColors = {
        assigned: [
          ['4fb124aebddb2adf1545030907687fa9a4c80e70', '#f14c4c'],
          ['42b8736b08170529903cd203a1f40382a4b4a8cd', '#3794ff'],
          ['1ba7bcd6ce6154e72e18b155475663ecbbd1f49d', '#cca700']
        ],
        available: copyOriginalExperimentColors().slice(3)
      }
      const expectedBranchColors = {
        assigned: [['main', '#13adc7']],
        available: copyOriginalBranchColors().slice(1)
      }

      const mockMemento = buildMockMemento()
      const mementoSpy = spy(mockMemento, 'get')

      const testRepository = disposable.track(
        new Experiments(
          'test',
          {} as InternalCommands,
          {} as EventEmitter<boolean>,
          {} as ResourceLocator,
          mockMemento,
          buildMockData()
        )
      )
      testRepository.setState(expShowFixture)
      await testRepository.isReady()
      expect(
        mementoSpy,
        'workspaceContext is called for sort initialization'
      ).to.be.calledWith('experimentsSortBy:test', [])
      expect(
        mementoSpy,
        'workspaceContext is called for filter initialization'
      ).to.be.calledWith('experimentsFilterBy:test', [])
      expect(
        mementoSpy,
        'workspaceContext is called for experiment color initialization'
      ).to.be.calledWith('experimentsColors:test', match.has('assigned'))
      expect(
        mementoSpy,
        'workspaceContext is called for branch color initialization'
      ).to.be.calledWith('branchColors:test', match.has('assigned'))
      expect(mementoSpy).to.be.calledWith('experimentsStatus:test', {})

      expect(
        testRepository.getSorts(),
        'Experiments starts with no sorts'
      ).to.deep.equal([])
      expect(
        mockMemento.keys(),
        'Memento starts with the colors and status keys'
      ).to.deep.equal([
        'experimentsStatus:test',
        'experimentsColors:test',
        'branchColors:test'
      ])
      expect(
        mockMemento.get('experimentsColors:test'),
        'the correct experiment colors are persisted'
      ).to.deep.equal(expectedExperimentColors)
      expect(
        mockMemento.get('branchColors:test'),
        'the correct branch colors are persisted'
      ).to.deep.equal(expectedBranchColors)

      expect(
        mockMemento.get('experimentsStatus:test'),
        'the correct statuses are persisted'
      ).to.deep.equal({
        '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d': 1,
        '42b8736b08170529903cd203a1f40382a4b4a8cd': 1,
        '4fb124aebddb2adf1545030907687fa9a4c80e70': 1
      })

      const mockPickSort = stub(SortQuickPicks, 'pickSortToAdd')

      mockPickSort.onFirstCall().resolves(firstSortDefinition)
      await testRepository.addSort()

      expect(
        mockMemento.get('experimentsSortBy:test'),
        'first sort is added to memento'
      ).to.deep.equal([firstSortDefinition])

      mockPickSort.onSecondCall().resolves(secondSortDefinition)
      await testRepository.addSort()

      expect(
        mockMemento.get('experimentsSortBy:test'),
        'second sort is added to the memento'
      ).to.deep.equal(sortDefinitions)

      const mockPickFilter = stub(FilterQuickPicks, 'pickFilterToAdd')

      mockPickFilter.onFirstCall().resolves(firstFilterDefinition)
      await testRepository.addFilter()
      expect(
        mockMemento.get('experimentsFilterBy:test'),
        'first filter should be added to memento after addFilter'
      ).to.deep.equal([firstFilterMapEntry])

      mockPickFilter.onSecondCall().resolves(secondFilterDefinition)
      await testRepository.addFilter()
      expect(
        mockMemento.get('experimentsFilterBy:test'),
        'second filter should be added to memento after addFilter'
      ).to.deep.equal(filterMapEntries)

      testRepository.removeFilter(firstFilterId)
      expect(
        mockMemento.get('experimentsFilterBy:test'),
        'first filter should be removed from memento after removeFilter'
      ).to.deep.equal([secondFilterMapEntry])

      testRepository.removeSort(firstSortDefinition.path)
      expect(
        mockMemento.get('experimentsSortBy:test'),
        'first sort should be removed from memento after removeSortByPath'
      ).to.deep.equal([secondSortDefinition])

      const mockRemoveSorts = stub(SortQuickPicks, 'pickSortsToRemove')

      mockRemoveSorts.onFirstCall().resolves([secondSortDefinition])
      await testRepository.removeSorts()
      expect(
        mockMemento.get('experimentsSortBy:test'),
        'all sorts should be removed from memento after removeSorts'
      ).to.deep.equal([])

      mockPickFilter.reset()
      mockPickFilter.onFirstCall().resolves(firstFilterDefinition)
      await testRepository.addFilter()
      expect(
        mockMemento.get('experimentsFilterBy:test'),
        'first filter should be re-added'
      ).to.deep.equal([secondFilterMapEntry, firstFilterMapEntry])

      const pickFiltersStub = stub(FilterQuickPicks, 'pickFiltersToRemove')
      pickFiltersStub
        .onFirstCall()
        .resolves([firstFilterDefinition, secondFilterDefinition])
      await testRepository.removeFilters()
      expect(
        mockMemento.get('experimentsFilterBy:test'),
        'both filters should be removed from memento after removeFilters is run against them'
      ).to.deep.equal([])

      testRepository.toggleExperimentStatus(
        '4fb124aebddb2adf1545030907687fa9a4c80e70'
      )
      expect(
        mockMemento.get('experimentsStatus:test'),
        'the correct statuses have been recorded in the memento'
      ).to.deep.equal({
        '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d': 1,
        '42b8736b08170529903cd203a1f40382a4b4a8cd': 1,
        '4fb124aebddb2adf1545030907687fa9a4c80e70': 0
      })
      expect(
        mockMemento.get('experimentsColors:test'),
        'the correct experiment colors are persisted'
      ).to.deep.equal(expectedExperimentColors)
      expect(
        mockMemento.get('branchColors:test'),
        'the correct branch colors are persisted'
      ).to.deep.equal(expectedBranchColors)
    })

    it('should initialize with state reflected from the given Memento', async () => {
      const assigned: [string, string][] = [
        ['4fb124aebddb2adf1545030907687fa9a4c80e70', '#1e5a52'],
        ['42b8736b08170529903cd203a1f40382a4b4a8cd', '#96958f'],
        ['1ba7bcd6ce6154e72e18b155475663ecbbd1f49d', '#5f5856']
      ]
      const available = ['#000000', '#FFFFFF', '#ABCDEF']

      const mockMemento = buildMockMemento({
        'experimentsColors:test': {
          assigned,
          available
        },
        'experimentsFilterBy:test': filterMapEntries,
        'experimentsSortBy:test': sortDefinitions,
        'experimentsStatus:test': {
          '1ba7bcd6ce6154e72e18b155475663ecbbd1f49d': 1,
          '42b8736b08170529903cd203a1f40382a4b4a8cd': 1,
          '4fb124aebddb2adf1545030907687fa9a4c80e70': 0
        }
      })

      const mementoSpy = spy(mockMemento, 'get')
      const testRepository = disposable.track(
        new Experiments(
          'test',
          {} as InternalCommands,
          {} as EventEmitter<boolean>,
          {} as ResourceLocator,
          mockMemento,
          buildMockData()
        )
      )
      testRepository.setState(expShowFixture)
      await testRepository.isReady()
      expect(mementoSpy).to.be.calledWith('experimentsSortBy:test', [])
      expect(mementoSpy).to.be.calledWith('experimentsFilterBy:test', [])
      expect(mementoSpy).to.be.calledWith('experimentsStatus:test', {})
      expect(testRepository.getSorts()).to.deep.equal(sortDefinitions)
      expect(testRepository.getFilters()).to.deep.equal([
        firstFilterDefinition,
        secondFilterDefinition
      ])
      const selected = testRepository.getSelectedExperiments()
      expect(selected).to.deep.equal({
        'exp-83425': '#5f5856',
        'test-branch': '#96958f'
      })
    })
  })
})
