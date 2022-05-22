import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore } from 'sinon'
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
import {
  Column,
  ColumnType,
  TableData
} from '../../../experiments/webview/contract'
import {
  buildInternalCommands,
  buildMockData,
  closeAllEditors,
  experimentsUpdatedEvent,
  extensionUri,
  getInputBoxEvent,
  getMessageReceivedEmitter
} from '../util'
import { buildMockMemento, dvcDemoPath } from '../../util'
import { SortDefinition } from '../../../experiments/model/sortBy'
import {
  FilterDefinition,
  getFilterId,
  Operator
} from '../../../experiments/model/filterBy'
import * as FilterQuickPicks from '../../../experiments/model/filterBy/quickPick'
import * as SortQuickPicks from '../../../experiments/model/sortBy/quickPick'
import { joinColumnPath } from '../../../experiments/columns/paths'
import { BaseWebview } from '../../../webview'
import { ColumnsModel } from '../../../experiments/columns/model'
import { MessageFromWebviewType } from '../../../webview/contract'
import { ExperimentsModel } from '../../../experiments/model'
import { copyOriginalColors } from '../../../experiments/model/status/colors'
import { AvailableCommands, InternalCommands } from '../../../commands/internal'
import { FileSystemData } from '../../../fileSystem/data'
import { ExperimentsData } from '../../../experiments/data'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import * as Telemetry from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import * as VscodeContext from '../../../vscode/context'

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
    it('should return all existing experiments, the workspace and branch (HEAD revision)', async () => {
      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      const runs = experiments.getExperiments()

      expect(runs.map(experiment => experiment.label)).to.deep.equal([
        'workspace',
        'main',
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

      const checkpoints = experiments.getCheckpoints('exp-e7a67')

      expect(checkpoints?.map(checkpoint => checkpoint.label)).to.deep.equal([
        'd1343a8',
        '1ee5f2e'
      ])
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
        hasCheckpoints: true,
        rows: rowsFixture,
        sorts: []
      }

      expect(messageSpy).to.be.calledWith(expectedTableData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(WEBVIEW_TEST_TIMEOUT)

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a column reordered message from the webview', async () => {
      const { experiments } = buildExperiments(disposable, expShowFixture)

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockColumnOrder = [
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
        ColumnsModel.prototype,
        'setColumnOrder'
      ).returns(undefined)

      mockMessageReceived.fire({
        payload: mockColumnOrder,
        type: MessageFromWebviewType.REORDER_COLUMNS
      })

      expect(mockSetColumnReordered).to.be.calledOnce
      expect(
        mockSetColumnReordered,
        'should correctly handle a columns reordered message'
      ).to.be.calledWithExactly(mockColumnOrder)
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_COLUMNS_REORDERED,
        undefined,
        undefined
      )
    })

    it('should handle a column resized message from the webview', async () => {
      const { experiments } = buildExperiments(disposable, expShowFixture)

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetColumnWidth = stub(
        ColumnsModel.prototype,
        'setColumnWidth'
      ).returns(undefined)

      const mockColumnId = 'params:params.yaml:lr'
      const mockWidth = 400

      mockMessageReceived.fire({
        payload: { id: mockColumnId, width: mockWidth },
        type: MessageFromWebviewType.RESIZE_COLUMN
      })

      expect(mockSetColumnWidth).to.be.calledOnce
      expect(
        mockSetColumnWidth,
        'should correctly handle a column resized message'
      ).to.be.calledWithExactly(mockColumnId, mockWidth)
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_RESIZE_COLUMN,
        { width: mockWidth },
        undefined
      )
    })

    it('should handle a toggle experiment message from the webview', async () => {
      const { experiments } = buildExperiments(disposable, expShowFixture)

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockToggleExperimentStatus = stub(
        experiments,
        'toggleExperimentStatus'
      ).returns(copyOriginalColors()[0])

      const mockExperimentId = 'workspace'

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      expect(mockToggleExperimentStatus).to.be.calledOnce
      expect(
        mockToggleExperimentStatus,
        'should correctly handle an experiment toggled message'
      ).to.be.calledWithExactly(mockExperimentId)
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_EXPERIMENT_TOGGLE,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a column sorted message from the webview', async () => {
      const { experiments } = buildExperiments(disposable, expShowFixture)

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockAddSort = stub(ExperimentsModel.prototype, 'addSort').returns(
        undefined
      )

      const mockSortDefinition: SortDefinition = {
        descending: false,
        path: 'params:params.yaml:lr'
      }

      mockMessageReceived.fire({
        payload: mockSortDefinition,
        type: MessageFromWebviewType.SORT_COLUMN
      })

      expect(mockAddSort).to.be.calledOnce
      expect(
        mockAddSort,
        'should correctly handle a column sorted message'
      ).to.be.calledWithExactly(mockSortDefinition)
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_SORT_COLUMN,
        mockSortDefinition,
        undefined
      )
    })

    it('should handle a column sort removed from the webview', async () => {
      const { experiments } = buildExperiments(disposable, expShowFixture)

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockRemoveSort = stub(
        ExperimentsModel.prototype,
        'removeSort'
      ).returns(undefined)

      const mockSortPath = 'params:params.yaml:lr'

      mockMessageReceived.fire({
        payload: mockSortPath,
        type: MessageFromWebviewType.REMOVE_COLUMN_SORT
      })

      expect(mockRemoveSort).to.be.calledOnce
      expect(
        mockRemoveSort,
        'should correctly handle a column sort removed message'
      ).to.be.calledWithExactly(mockSortPath)
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_REMOVE_COLUMN_SORT,
        {
          path: mockSortPath
        },
        undefined
      )
    })
  })

  describe('handleMessageFromWebview', () => {
    const setupExperimentsAndMockCommands = () => {
      const { experiments, experimentsModel, internalCommands } =
        buildExperiments(disposable, expShowFixture)

      const mockExecuteCommand = stub(
        internalCommands,
        'executeCommand'
      ).resolves(undefined)

      return { experiments, experimentsModel, mockExecuteCommand }
    }

    it('should be able to handle a message to apply an experiment to workspace', async () => {
      const { experiments, mockExecuteCommand } =
        setupExperimentsAndMockCommands()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
      })

      expect(mockExecuteCommand).to.be.calledOnce
      expect(mockExecuteCommand).to.be.calledWithExactly(
        AvailableCommands.EXPERIMENT_APPLY,
        dvcDemoPath,
        mockExperimentId
      )
    })

    it('should be able to handle a message to create a branch from an experiment', async () => {
      const { experiments, mockExecuteCommand } =
        setupExperimentsAndMockCommands()

      const mockBranch = 'mock-branch-input'
      const inputEvent = getInputBoxEvent(mockBranch)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT
      })

      await inputEvent
      expect(mockExecuteCommand).to.be.calledOnce
      expect(mockExecuteCommand).to.be.calledWithExactly(
        AvailableCommands.EXPERIMENT_BRANCH,
        dvcDemoPath,
        mockExperimentId,
        mockBranch
      )
    })

    it("should be able to handle a message to modify an experiment's params and queue an experiment", async () => {
      const { experiments, mockExecuteCommand } =
        setupExperimentsAndMockCommands()

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.001',
        '-S',
        'params.yaml:weight_decay=0'
      ]

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'
      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_QUEUE
      })

      await tableChangePromise
      expect(mockExecuteCommand).to.be.calledOnce
      expect(mockExecuteCommand).to.be.calledWithExactly(
        AvailableCommands.EXPERIMENT_QUEUE,
        dvcDemoPath,
        ...mockModifiedParams
      )
    })

    it("should be able to handle a message to modify an experiment's params and run a new experiment", async () => {
      const { experiments, mockExecuteCommand } =
        setupExperimentsAndMockCommands()

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.001',
        '-S',
        'params.yaml:weight_decay=0'
      ]

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'
      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_RUN
      })

      await tableChangePromise
      expect(mockExecuteCommand).to.be.calledOnce
      expect(mockExecuteCommand).to.be.calledWithExactly(
        AvailableCommands.EXPERIMENT_RUN,
        dvcDemoPath,
        ...mockModifiedParams
      )
    })

    it("should be able to handle a message to modify an experiment's params reset and run a new experiment", async () => {
      const { experiments, mockExecuteCommand } =
        setupExperimentsAndMockCommands()

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.0001',
        '-S',
        'params.yaml:weight_decay=0.2'
      ]

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'
      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_RESET_AND_RUN
      })

      await tableChangePromise
      expect(mockExecuteCommand).to.be.calledOnce
      expect(mockExecuteCommand).to.be.calledWithExactly(
        AvailableCommands.EXPERIMENT_RESET_AND_RUN,
        dvcDemoPath,
        ...mockModifiedParams
      )
    })

    it('should be able to handle a message to remove an experiment', async () => {
      const { experiments, mockExecuteCommand } =
        setupExperimentsAndMockCommands()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.REMOVE_EXPERIMENT
      })

      expect(mockExecuteCommand).to.be.calledOnce
      expect(mockExecuteCommand).to.be.calledWithExactly(
        AvailableCommands.EXPERIMENT_REMOVE,
        dvcDemoPath,
        mockExperimentId
      )
    })

    it("should be able to handle a message to toggle an experiment's status", async () => {
      const { experiments, experimentsModel } =
        setupExperimentsAndMockCommands()

      const experimentToToggle = 'exp-e7a67'
      const queuedExperiment = '90aea7f2482117a55dfcadcdb901aaa6610fbbc9'

      const isExperimentSelected = (expId: string): boolean =>
        !!experimentsModel.getExperiments().find(({ id }) => id === expId)
          ?.selected

      expect(isExperimentSelected(experimentToToggle), 'experiment is selected')
        .to.be.true
      expect(
        isExperimentSelected(queuedExperiment),
        'queued experiment cannot be selected'
      ).to.be.false

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const toggleSpy = spy(experimentsModel, 'toggleStatus')

      mockMessageReceived.fire({
        payload: experimentToToggle,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      expect(toggleSpy).to.be.calledWith(experimentToToggle)
      toggleSpy.resetHistory()

      expect(
        isExperimentSelected(experimentToToggle),
        'experiment has been toggled to unselected'
      ).to.be.false

      mockMessageReceived.fire({
        payload: queuedExperiment,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      expect(toggleSpy).to.be.calledWith(queuedExperiment)

      expect(
        isExperimentSelected(queuedExperiment),
        'queued experiment cannot be selected'
      ).to.be.false
    })
  })

  describe('Sorting', () => {
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
          buildMockData<ExperimentsData>(),
          buildMockData<FileSystemData>()
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

      const colors = copyOriginalColors()

      expect(messageSpy).to.be.calledWithMatch({
        rows: [
          {
            displayColor: colors[0],
            id: 'workspace',
            label: 'workspace',
            params: { 'params.yaml': { test: 10 } },
            selected: true
          },
          {
            displayColor: colors[1],
            id: 'testBranch',
            label: 'testBranch',
            name: 'testBranch',
            params: { 'params.yaml': { test: 10 } },
            selected: true,
            sha: 'testBranch',
            subRows: [
              {
                displayColor: colors[2],
                id: 'testExp1',
                label: 'testExp',
                params: { 'params.yaml': { test: 2 } },
                selected: true,
                sha: 'testExp1'
              },
              {
                displayColor: colors[3],
                id: 'testExp2',
                label: 'testExp',
                params: { 'params.yaml': { test: 1 } },
                selected: true,
                sha: 'testExp2'
              },
              {
                displayColor: colors[4],
                id: 'testExp3',
                label: 'testExp',
                params: { 'params.yaml': { test: 3 } },
                selected: true,
                sha: 'testExp3'
              }
            ]
          }
        ],
        sorts: []
      })

      const mockShowQuickPick = stub(window, 'showQuickPick')
      const sortPath = joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'test')

      mockShowQuickPick.onFirstCall().resolves({
        label: 'test',
        value: {
          path: sortPath
        }
      } as QuickPickItemWithValue<Column>)

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
            displayColor: colors[0],
            id: 'workspace',
            label: 'workspace',
            params: { 'params.yaml': { test: 10 } },
            selected: true
          },
          {
            displayColor: colors[1],
            id: 'testBranch',
            label: 'testBranch',
            name: 'testBranch',
            params: { 'params.yaml': { test: 10 } },
            selected: true,
            sha: 'testBranch',
            subRows: [
              {
                displayColor: colors[3],
                id: 'testExp2',
                label: 'testExp',
                params: { 'params.yaml': { test: 1 } },
                selected: true,
                sha: 'testExp2'
              },
              {
                displayColor: colors[2],
                id: 'testExp1',
                label: 'testExp',
                params: { 'params.yaml': { test: 2 } },
                selected: true,
                sha: 'testExp1'
              },
              {
                displayColor: colors[4],
                id: 'testExp3',
                label: 'testExp',
                params: { 'params.yaml': { test: 3 } },
                selected: true,
                sha: 'testExp3'
              }
            ]
          }
        ],
        sorts: [{ descending: false, path: sortPath }]
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })

  describe('persisted state', () => {
    const firstSortDefinition = {
      descending: false,
      path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'test')
    }
    const secondSortDefinition = {
      descending: true,
      path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'other')
    }
    const sortDefinitions: SortDefinition[] = [
      firstSortDefinition,
      secondSortDefinition
    ]

    const firstFilterId = joinColumnPath(
      ColumnType.PARAMS,
      'params.yaml',
      'test==1'
    )
    const firstFilterDefinition = {
      operator: Operator.EQUAL,
      path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'test'),
      value: 1
    }
    const secondFilterId = joinColumnPath(
      ColumnType.PARAMS,
      'params.yaml',
      'other∈testcontains'
    )
    const secondFilterDefinition = {
      operator: Operator.CONTAINS,
      path: joinColumnPath(ColumnType.PARAMS, 'params.yaml', 'other'),
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
      const colors = copyOriginalColors()
      const mockMemento = buildMockMemento()
      const mementoSpy = spy(mockMemento, 'get')

      const testRepository = disposable.track(
        new Experiments(
          'test',
          {} as InternalCommands,
          {} as EventEmitter<boolean>,
          {} as ResourceLocator,
          mockMemento,
          buildMockData<ExperimentsData>(),
          buildMockData<FileSystemData>()
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
        testRepository.getSorts(),
        'Experiments starts with no sorts'
      ).to.deep.equal([])
      expect(
        mockMemento.keys(),
        'Memento starts with the status key'
      ).to.deep.equal(['experimentsStatus:test'])

      expect(
        mockMemento.get('experimentsStatus:test'),
        'the correct statuses are persisted'
      ).to.deep.equal({
        '1ee5f2ecb0fa4d83cbf614386536344cf894dd53': 0,
        '217312476f8854dda1865450b737eb6bc7a3ba1b': 0,
        '22e40e1fa3c916ac567f69b85969e3066a91dda4': 0,
        '23250b33e3d6dd0e136262d1d26a2face031cb03': 0,
        '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15': 0,
        '9523bde67538cf31230efaff2dbc47d38a944ab5': 0,
        c658f8b14ac819ac2a5ea0449da6c15dbe8eb880: 0,
        d1343a87c6ee4a2e82d19525964d2fb2cb6756c9: 0,
        e821416bfafb4bc28b3e0a8ddb322505b0ad2361: 0,
        'exp-83425': colors[4],
        'exp-e7a67': colors[2],
        main: colors[1],
        'test-branch': colors[3],
        workspace: colors[0]
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

      await testRepository.removeFilter(firstFilterId)
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
        .resolves([
          getFilterId(firstFilterDefinition),
          getFilterId(secondFilterDefinition)
        ])
      await testRepository.removeFilters()
      expect(
        mockMemento.get('experimentsFilterBy:test'),
        'both filters should be removed from memento after removeFilters is run against them'
      ).to.deep.equal([])

      testRepository.toggleExperimentStatus('exp-e7a67')
      expect(
        mockMemento.get('experimentsStatus:test'),
        'the correct statuses have been recorded in the memento'
      ).to.deep.equal({
        '1ee5f2ecb0fa4d83cbf614386536344cf894dd53': 0,
        '217312476f8854dda1865450b737eb6bc7a3ba1b': 0,
        '22e40e1fa3c916ac567f69b85969e3066a91dda4': 0,
        '23250b33e3d6dd0e136262d1d26a2face031cb03': 0,
        '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15': 0,
        '9523bde67538cf31230efaff2dbc47d38a944ab5': 0,
        c658f8b14ac819ac2a5ea0449da6c15dbe8eb880: 0,
        d1343a87c6ee4a2e82d19525964d2fb2cb6756c9: 0,
        e821416bfafb4bc28b3e0a8ddb322505b0ad2361: 0,
        'exp-83425': colors[4],
        'exp-e7a67': 0,
        main: colors[1],
        'test-branch': colors[3],
        workspace: colors[0]
      })
    })

    it('should initialize with state reflected from the given Memento', async () => {
      const colors = copyOriginalColors()
      const mockMemento = buildMockMemento({
        'experimentsFilterBy:test': filterMapEntries,
        'experimentsSortBy:test': sortDefinitions,
        'experimentsStatus:test': {
          'exp-83425': colors[0],
          'exp-e7a67': 0,
          'test-branch': colors[1]
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
          buildMockData<ExperimentsData>(),
          buildMockData<FileSystemData>()
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
      const selected = testRepository
        .getSelectedExperiments()
        .map(({ displayColor, id }) => ({ displayColor, id }))
      expect(selected).to.deep.equal([
        { displayColor: colors[1], id: 'test-branch' },
        {
          displayColor: colors[0],
          id: 'exp-83425'
        }
      ])
    })
  })

  describe('editor/title icons', () => {
    const getActiveEditorUpdatedEvent = () =>
      new Promise(resolve => {
        const listener = disposable.track(
          window.onDidChangeActiveTextEditor(() => {
            resolve(undefined)
            disposable.untrack(listener)
            listener.dispose()
          })
        )
      })

    it('should set the appropriate context value when a params file is opened', async () => {
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const paramsFile = Uri.file(join(dvcDemoPath, 'params.yaml'))

      const setContextValueSpy = spy(VscodeContext, 'setContextValue')

      const activeEditorUpdated = getActiveEditorUpdatedEvent()

      await window.showTextDocument(paramsFile)
      await activeEditorUpdated

      const activeEditorClosed = getActiveEditorUpdatedEvent()

      expect(setContextValueSpy).to.be.calledOnce
      expect(setContextValueSpy).to.be.calledWithExactly(
        'dvc.params.fileActive',
        true
      )

      setContextValueSpy.resetHistory()

      await closeAllEditors()
      await activeEditorClosed

      expect(setContextValueSpy).to.be.calledOnce
      expect(setContextValueSpy).to.be.calledWithExactly(
        'dvc.params.fileActive',
        false
      )
    })

    it('should set the appropriate context value when a params file is open and the extension starts', async () => {
      const paramsFile = Uri.file(join(dvcDemoPath, 'params.yaml'))
      await window.showTextDocument(paramsFile)

      const setContextValueSpy = spy(VscodeContext, 'setContextValue')

      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      expect(setContextValueSpy).to.be.calledOnce
      expect(setContextValueSpy).to.be.calledWithExactly(
        'dvc.params.fileActive',
        true
      )

      setContextValueSpy.resetHistory()
      const activeEditorClosed = getActiveEditorUpdatedEvent()

      await closeAllEditors()
      await activeEditorClosed

      expect(setContextValueSpy).to.be.calledOnce
      expect(setContextValueSpy).to.be.calledWithExactly(
        'dvc.params.fileActive',
        false
      )
    })
  })

  it('should not set a context value when a non-params file is open and the extension starts', async () => {
    const nonParamsFile = Uri.file(join(dvcDemoPath, '.gitignore'))
    await window.showTextDocument(nonParamsFile)

    const setContextValueSpy = spy(VscodeContext, 'setContextValue')

    const { experiments } = buildExperiments(disposable)
    await experiments.isReady()

    expect(setContextValueSpy).not.to.be.called
  })
})
