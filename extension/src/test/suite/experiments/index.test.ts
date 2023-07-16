/* eslint-disable sort-keys-fix/sort-keys-fix */
import { join, resolve } from 'path'
import { after, afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore, SinonStub } from 'sinon'
import {
  window,
  commands,
  workspace,
  Uri,
  QuickPickItem,
  ViewColumn,
  CancellationToken,
  WorkspaceConfiguration,
  MessageItem,
  ConfigurationTarget
} from 'vscode'
import {
  DEFAULT_EXPERIMENTS_OUTPUT,
  buildExperiments,
  stubWorkspaceExperimentsGetters
} from './util'
import { Disposable } from '../../../extension'
import expShowFixture from '../../fixtures/expShow/base/output'
import rowsFixture from '../../fixtures/expShow/base/rows'
import columnsFixture, {
  dataColumnOrder as columnsOrderFixture
} from '../../fixtures/expShow/base/columns'
import workspaceChangesFixture from '../../fixtures/expShow/base/workspaceChanges'
import { Experiments } from '../../../experiments'
import { ResourceLocator } from '../../../resourceLocator'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../vscode/quickPick'
import {
  Column,
  ColumnType,
  Commit,
  TableData
} from '../../../experiments/webview/contract'
import {
  buildInternalCommands,
  buildMockExperimentsData,
  bypassProgressCloseDelay,
  closeAllEditors,
  configurationChangeEvent,
  experimentsUpdatedEvent,
  extensionUri,
  getActiveEditorUpdatedEvent,
  getInputBoxEvent,
  getMessageReceivedEmitter
} from '../util'
import { buildMockMemento, dvcDemoPath } from '../../util'
import { generateTestExpShowOutput } from '../../util/experiments'
import { SortDefinition } from '../../../experiments/model/sortBy'
import {
  FilterDefinition,
  getFilterId,
  Operator
} from '../../../experiments/model/filterBy'
import * as FilterQuickPicks from '../../../experiments/model/filterBy/quickPick'
import * as SortQuickPicks from '../../../experiments/model/sortBy/quickPick'
import { buildMetricOrParamPath } from '../../../experiments/columns/paths'
import { BaseWebview } from '../../../webview'
import { ColumnsModel } from '../../../experiments/columns/model'
import { MessageFromWebviewType } from '../../../webview/contract'
import { ExperimentsModel } from '../../../experiments/model'
import { copyOriginalColors } from '../../../experiments/model/status/colors'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import * as Telemetry from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import * as VscodeContext from '../../../vscode/context'
import { Title } from '../../../vscode/title'
import { ExperimentFlag } from '../../../cli/dvc/constants'
import { DvcExecutor } from '../../../cli/dvc/executor'
import { WorkspacePlots } from '../../../plots/workspace'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../commands/external'
import { ConfigKey } from '../../../vscode/config'
import { EXPERIMENT_WORKSPACE_ID } from '../../../cli/dvc/contract'
import * as Time from '../../../util/time'
import { AvailableCommands } from '../../../commands/internal'
import { Setup } from '../../../setup'
import * as FileSystem from '../../../fileSystem'
import * as ProcessExecution from '../../../process/execution'
import { DvcViewer } from '../../../cli/dvc/viewer'
import { DEFAULT_NB_ITEMS_PER_ROW } from '../../../plots/webview/contract'
import { Toast } from '../../../vscode/toast'
import { Response } from '../../../vscode/response'
import { MAX_SELECTED_EXPERIMENTS } from '../../../experiments/model/status'
import { Pipeline } from '../../../pipeline'
import { buildExperimentsPipeline } from '../pipeline/util'

const { openFileInEditor } = FileSystem

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
    it('should return the workspace and commit (HEAD revision)', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

      await experiments.isReady()

      const runs = experiments.getWorkspaceAndCommits()

      expect(runs.map(experiment => experiment.label)).to.deep.equal(
        rowsFixture.map(({ label }) => label)
      )
    })
  })

  describe('showWebview', () => {
    it('should be able to make the experiment webview visible', async () => {
      const { experiments, messageSpy } = buildExperiments({
        disposer: disposable
      })

      const webview = await experiments.showWebview()

      const expectedTableData: Partial<TableData> = {
        changes: workspaceChangesFixture,
        columnOrder: columnsOrderFixture,
        columnWidths: {},
        columns: columnsFixture,
        filters: [],
        hasCheckpoints: true,
        hasColumns: true,
        hasConfig: true,
        hasRunningWorkspaceExperiment: true,
        rows: rowsFixture,
        sorts: []
      }

      expect(messageSpy).to.be.calledWithMatch(expectedTableData)

      expect(webview.isActive()).to.be.true
      expect(webview.isVisible()).to.be.true
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should only be able to open a single experiments webview', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

      const windowSpy = spy(window, 'createWebviewPanel')
      const document = await openFileInEditor(resolve(dvcDemoPath, 'train.py'))

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

    it('should set hasConfig to false if there are no stages', async () => {
      const { experiments, messageSpy } = buildExperiments({
        disposer: disposable,
        stageList: ''
      })

      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        hasConfig: false
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set hasConfig to true if there is a broken dvc.yaml', async () => {
      const { experiments, messageSpy } = buildExperiments({
        disposer: disposable,
        stageList: null
      })

      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        hasConfig: true
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set hasConfig to true if there are stages', async () => {
      const { experiments, messageSpy } = buildExperiments({
        disposer: disposable
      })

      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        hasConfig: true
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set hasMoreCommits to true if there are more commits to show', async () => {
      const { experiments, messageSpy } = buildExperiments({
        availableNbCommits: { main: 404 },
        disposer: disposable
      })

      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        hasMoreCommits: { main: true }
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set hasMoreCommits to false if there are more commits to show', async () => {
      const { experiments, messageSpy } = buildExperiments({
        availableNbCommits: { main: 1 },
        disposer: disposable
      })

      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        hasMoreCommits: { main: false }
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set isShowingMoreCommits to true if it is showing more than the current commit', async () => {
      const { experiments, messageSpy } = buildExperiments({
        availableNbCommits: { main: 40000 },
        disposer: disposable
      })

      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        isShowingMoreCommits: { main: true }
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set isShowingMoreCommits to false it is showing only the current commit', async () => {
      const { experiments, experimentsModel, messageSpy } = buildExperiments({
        expShow: expShowFixture.slice(0, 2),
        disposer: disposable
      })

      stub(experimentsModel, 'getNbOfCommitsToShow').returns(1)

      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        isShowingMoreCommits: { main: false }
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })

  describe('handleMessageFromWebview', () => {
    after(() =>
      workspace
        .getConfiguration()
        .update(ConfigKey.EXP_TABLE_HEAD_MAX_HEIGHT, undefined, false)
    )

    const setupExperimentsAndMockCommands = () => {
      const {
        columnsModel,
        experiments,
        experimentsModel,
        internalCommands,
        dvcExecutor,
        mockCheckOrAddPipeline,
        messageSpy,
        mockUpdateExperimentsData,
        mockSelectBranches
      } = buildExperiments({ disposer: disposable, expShow: expShowFixture })
      const mockExecuteCommand = stub(
        internalCommands,
        'executeCommand'
      ).callsFake(commandId => {
        switch (commandId) {
          case AvailableCommands.GIT_GET_COMMIT_MESSAGES:
            return Promise.resolve('')
          case AvailableCommands.GIT_GET_BRANCHES:
            return Promise.resolve([
              'main',
              'other',
              'one-more',
              'important-fix'
            ])
          default:
            return Promise.resolve(undefined)
        }
      })
      return {
        columnsModel,
        dvcExecutor,
        experiments,
        experimentsModel,
        messageSpy,
        mockCheckOrAddPipeline,
        mockExecuteCommand,
        mockSelectBranches,
        mockUpdateExperimentsData
      }
    }

    it('should handle a column reordered message from the webview', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a column resized message from the webview', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockSetColumnWidth = stub(
        ColumnsModel.prototype,
        'setColumnWidth'
      ).returns(undefined)

      const mockColumnId = 'params:params.yaml:lr'
      const mockWidth = DEFAULT_NB_ITEMS_PER_ROW

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a column sorted message from the webview', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a column sort removed from the webview', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to hide a table column', async () => {
      const { experiments, columnsModel } = buildExperiments({
        disposer: disposable
      })

      const mockUnselect = stub(columnsModel, 'unselect')
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockColumnId = 'mock-column-id'

      mockMessageReceived.fire({
        payload: mockColumnId,
        type: MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN
      })

      expect(mockUnselect).to.be.calledOnce
      expect(mockUnselect).to.be.calledWithExactly(mockColumnId)

      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_HIDE_COLUMN,
        { path: mockColumnId },
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to open the source params file from a column path', async () => {
      const { experiments } = setupExperimentsAndMockCommands()

      const mockShowTextDocument = stub(window, 'showTextDocument')
      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockColumnId = 'params:params.yaml_5'

      mockMessageReceived.fire({
        payload: mockColumnId,
        type: MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE
      })

      expect(mockShowTextDocument).to.be.calledOnce
      expect(mockShowTextDocument).to.be.calledWithExactly(
        Uri.file(join(dvcDemoPath, 'params.yaml')),
        {
          viewColumn: ViewColumn.Beside
        }
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to open different params files than the default one', async () => {
      const { experiments } = setupExperimentsAndMockCommands()

      const mockShowTextDocument = stub(window, 'showTextDocument')
      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockColumnId = 'params:params_alt.json_5:nested1.nested2'

      mockMessageReceived.fire({
        payload: mockColumnId,
        type: MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE
      })

      expect(mockShowTextDocument).to.be.calledOnce
      expect(mockShowTextDocument).to.be.calledWithExactly(
        Uri.file(join(dvcDemoPath, 'params_alt.json')),
        {
          viewColumn: ViewColumn.Beside
        }
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to apply an experiment', async () => {
      const { experiments } = stubWorkspaceExperimentsGetters(disposable)
      await experiments.isReady()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'exp-e7a67'

      const mockExperimentApply = stub(
        DvcExecutor.prototype,
        'expApply'
      ).resolves(undefined)

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
      })

      expect(mockExperimentApply).to.be.calledOnce
      expect(mockExperimentApply).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperimentId
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to create a branch from an experiment', async () => {
      const { experiments } = stubWorkspaceExperimentsGetters(disposable)
      await experiments.isReady()

      const mockBranch = 'mock-branch-input'
      const inputEvent = getInputBoxEvent(mockBranch)

      const mockExperimentBranch = stub(
        DvcExecutor.prototype,
        'expBranch'
      ).resolves('undefined')

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'exp-e7a67'

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT
      })

      await inputEvent
      expect(mockExperimentBranch).to.be.calledOnce
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperimentId,
        mockBranch
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to show the logs of an experiment', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })
      await experiments.isReady()

      const mockExpId = 'exp-e7a67'

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const executeCommandSpy = spy(commands, 'executeCommand')

      const mockShowLogs = stub(DvcViewer.prototype, 'queueLogs')

      const logsShown = new Promise(resolve =>
        mockShowLogs.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      )

      mockMessageReceived.fire({
        payload: mockExpId,
        type: MessageFromWebviewType.SHOW_EXPERIMENT_LOGS
      })

      await logsShown

      expect(executeCommandSpy).to.be.calledWithExactly(
        RegisteredCliCommands.EXPERIMENT_VIEW_SHOW_LOGS,
        { dvcRoot: dvcDemoPath, id: mockExpId }
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to push an experiment', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })
      await experiments.isReady()

      const mockExpId = 'exp-e7a67'

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const executeCommandSpy = spy(commands, 'executeCommand')
      const mockExpPush = stub(DvcExecutor.prototype, 'expPush')

      const mockGetStudioAccessToken = stub(
        Setup.prototype,
        'getStudioAccessToken'
      )

      const tokenNotFound = new Promise(resolve =>
        mockGetStudioAccessToken.callsFake(() => {
          resolve(undefined)
          return ''
        })
      )

      const mockAskShowOrCloseOrNever = stub(Toast, 'askShowOrCloseOrNever')

      const userPrompted = new Promise(resolve =>
        mockAskShowOrCloseOrNever.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(Response.SHOW)
        })
      )

      mockMessageReceived.fire({
        payload: [mockExpId],
        type: MessageFromWebviewType.PUSH_EXPERIMENT
      })

      await Promise.all([tokenNotFound, userPrompted])

      expect(executeCommandSpy).to.be.calledWithExactly(
        RegisteredCommands.SETUP_SHOW_STUDIO_CONNECT
      )

      mockGetStudioAccessToken.resetBehavior()

      const tokenFound = new Promise(resolve =>
        mockGetStudioAccessToken.callsFake(() => {
          resolve(undefined)
          return 'isat_token'
        })
      )

      const mockShowProgress = stub(Toast, 'showProgress')
      bypassProgressCloseDelay()

      const mockReport = stub()

      mockShowProgress.callsFake((title, callback) => {
        expect(title).to.equal('exp push')

        const progress = { report: mockReport }
        return callback(progress, {} as CancellationToken)
      })

      const commandExecuted = new Promise(resolve =>
        mockExpPush.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(
            "Experiment major-lamb is up to date on Git remote 'origin'.\nView your experiments at \nhttps://studio.iterative.ai/user/mattseddon/projects/vscode-dvc-demo-ynm6t3jxdx"
          )
        })
      )

      mockMessageReceived.fire({
        payload: [mockExpId],
        type: MessageFromWebviewType.PUSH_EXPERIMENT
      })

      await Promise.all([tokenFound, commandExecuted])

      expect(mockExpPush).to.be.calledWithExactly(dvcDemoPath, mockExpId)
      expect(mockReport).to.be.calledWithExactly({
        increment: 75,
        message:
          "Experiment major-lamb is up to date on Git remote 'origin'.\nView your experiments in [Studio](https://studio.iterative.ai/user/mattseddon/projects/vscode-dvc-demo-ynm6t3jxdx)"
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to modify the workspace params and queue an experiment', async () => {
      const { experiments, dvcExecutor } =
        stubWorkspaceExperimentsGetters(disposable)

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.001',
        '-S',
        'params.yaml:weight_decay=0'
      ]

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)
      const mockQueueExperiment = stub(dvcExecutor, 'expRunQueue').resolves(
        undefined
      )

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_AND_QUEUE
      })

      await tableChangePromise
      expect(mockQueueExperiment).to.be.calledOnce
      expect(mockQueueExperiment).to.be.calledWithExactly(
        dvcDemoPath,
        ...mockModifiedParams
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to modify the workspace params and run a new experiment', async () => {
      const { experiments, dvcRunner } =
        stubWorkspaceExperimentsGetters(disposable)

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.001',
        '-S',
        'params.yaml:weight_decay=0'
      ]

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)
      const mockRunExperiment = stub(dvcRunner, 'runExperiment').resolves(
        undefined
      )

      const webview = await experiments.showWebview()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_AND_RUN
      })

      await tableChangePromise
      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWithExactly(
        dvcDemoPath,
        ...mockModifiedParams
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to modify the workspace params, reset and run a new experiment', async () => {
      const { experiments, dvcRunner } =
        stubWorkspaceExperimentsGetters(disposable)

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.0001',
        '-S',
        'params.yaml:weight_decay=0.2'
      ]

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockRunExperiment = stub(dvcRunner, 'runExperiment').resolves(
        undefined
      )

      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_RESET_AND_RUN
      })

      await tableChangePromise
      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWithExactly(
        dvcDemoPath,
        ExperimentFlag.RESET,
        ...mockModifiedParams
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to remove an experiment', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'

      const mockExperimentRemove = stub(
        DvcExecutor.prototype,
        'expRemove'
      ).resolves(undefined)

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.REMOVE_EXPERIMENT
      })

      expect(mockExperimentRemove).to.be.calledOnce
      expect(mockExperimentRemove).to.be.calledWithExactly(
        dvcDemoPath,
        mockExperimentId
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should be able to handle a message to toggle an experiment's status", async () => {
      const { experiments, experimentsModel } =
        stubWorkspaceExperimentsGetters(disposable)

      await experiments.isReady()

      const idToToggle = 'test-branch'
      const runningInQueueId = 'exp-e7a67'
      const queuedId = '90aea7f'

      const isExperimentSelected = (expId: string): boolean =>
        !!experimentsModel.getCombinedList().find(({ id }) => id === expId)
          ?.selected

      expect(
        isExperimentSelected(idToToggle),
        'experiment is not initially selected'
      ).to.be.false

      expect(
        isExperimentSelected(runningInQueueId),
        'experiment running in the queue cannot be selected'
      ).to.be.false
      expect(
        isExperimentSelected(queuedId),
        'queued experiment cannot be selected'
      ).to.be.false

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const toggleSpy = spy(experimentsModel, 'toggleStatus')

      mockMessageReceived.fire({
        payload: idToToggle,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      expect(toggleSpy).to.be.calledWith(idToToggle)
      toggleSpy.resetHistory()

      expect(
        isExperimentSelected(idToToggle),
        'experiment has been toggled to selected'
      ).to.be.true

      mockMessageReceived.fire({
        payload: idToToggle,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      expect(toggleSpy).to.be.calledWith(idToToggle)
      toggleSpy.resetHistory()

      expect(
        isExperimentSelected(idToToggle),
        'experiment has been toggled to unselected'
      ).to.be.false

      mockMessageReceived.fire({
        payload: runningInQueueId,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      expect(toggleSpy).to.be.calledWith(runningInQueueId)

      expect(
        isExperimentSelected(runningInQueueId),
        'experiment running in the queue can be selected'
      ).to.be.true

      mockMessageReceived.fire({
        payload: queuedId,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      })

      expect(toggleSpy).to.be.calledWith(queuedId)

      expect(
        isExperimentSelected(queuedId),
        'queued experiment cannot be selected'
      ).to.be.false
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should show an information toast when the user tries to toggle an experiment when the max number are already selected', async () => {
      const { experiments, experimentsModel } = buildExperiments({
        disposer: disposable
      })

      await experiments.isReady()

      const mockShowInformationMessage = stub(
        window,
        'showInformationMessage'
      ).resolves(Response.NEVER as unknown as MessageItem)

      const mockUpdate = stub()
      const updateCalled = new Promise(resolve =>
        mockUpdate.callsFake(() => {
          resolve(undefined)
          return Promise.resolve()
        })
      )
      stub(workspace, 'getConfiguration').returns({
        get: stub(),
        update: mockUpdate
      } as unknown as WorkspaceConfiguration)

      const allExperiments =
        experimentsModel.getWorkspaceCommitsAndExperiments()

      const experimentsToSelect = allExperiments.slice(
        0,
        MAX_SELECTED_EXPERIMENTS
      )

      const overMaxSelected = allExperiments[MAX_SELECTED_EXPERIMENTS].id

      experimentsModel.setSelected(experimentsToSelect)
      expect(experiments.getSelectedRevisions()).to.have.lengthOf(
        MAX_SELECTED_EXPERIMENTS
      )

      experiments.toggleExperimentStatus(overMaxSelected)

      await updateCalled

      expect(
        !!experimentsModel
          .getCombinedList()
          .find(({ id }) => id === overMaxSelected)?.selected,
        'experiment is not selected'
      ).to.be.false

      expect(mockShowInformationMessage).to.be.called
      expect(mockUpdate).to.be.calledWithExactly(
        ConfigKey.DO_NOT_INFORM_MAX_PLOTTED,
        true,
        ConfigurationTarget.Global
      )
    })

    it('should be able to handle a message to select columns', async () => {
      const { columnsModel, experiments, messageSpy } =
        setupExperimentsAndMockCommands()

      const webview = await experiments.showWebview()
      messageSpy.resetHistory()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockShowQuickPick = stub(window, 'showQuickPick') as SinonStub<
        [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
        Thenable<QuickPickItem[] | QuickPickItemWithValue<string> | undefined>
      >
      mockShowQuickPick.resolves([])

      const tableChangePromise = experimentsUpdatedEvent(experiments)
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SELECT_COLUMNS
      })

      expect(mockShowQuickPick).to.be.calledWith(
        columnsModel.getTerminalNodes().map(column => ({
          label: column.path,
          picked: column.selected,
          value: column
        })),
        { canPickMany: true, title: Title.SELECT_COLUMNS }
      )

      await tableChangePromise

      const allColumnsUnselected: Partial<TableData> = {
        changes: workspaceChangesFixture,
        columnOrder: columnsOrderFixture,
        columnWidths: {},
        columns: [],
        filters: [],
        rows: rowsFixture,
        sorts: []
      }

      expect(messageSpy).to.be.calledWithMatch(allColumnsUnselected)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to focus the sorts tree', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const executeCommandStub = stub(commands, 'executeCommand')

      const messageReceived = new Promise(resolve =>
        disposable.track(mockMessageReceived.event(() => resolve(undefined)))
      )

      mockMessageReceived.fire({
        type: MessageFromWebviewType.FOCUS_SORTS_TREE
      })

      expect(executeCommandStub).to.be.calledWith(
        'dvc.views.experimentsSortByTree.focus'
      )

      await messageReceived
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(
        mockSendTelemetryEvent,
        'should send a telemetry call that the sorts tree has been focused'
      ).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_SORTS_TREE,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to focus the filters tree', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const executeCommandStub = stub(commands, 'executeCommand')

      const messageReceived = new Promise(resolve =>
        disposable.track(mockMessageReceived.event(() => resolve(undefined)))
      )

      mockMessageReceived.fire({
        type: MessageFromWebviewType.FOCUS_FILTERS_TREE
      })

      expect(executeCommandStub).to.be.calledWith(
        'dvc.views.experimentsFilterByTree.focus'
      )

      await messageReceived
      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(
        mockSendTelemetryEvent,
        'should send a telemetry call that the filters tree has been focused'
      ).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_FILTERS_TREE,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to update the table depth', async () => {
      const { experiments } = buildExperiments({ disposer: disposable })
      const inputEvent = getInputBoxEvent('0')
      const tableMaxDepthChanged = configurationChangeEvent(
        ConfigKey.EXP_TABLE_HEAD_MAX_HEIGHT,
        disposable
      )

      const webview = await experiments.showWebview()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SET_EXPERIMENTS_HEADER_HEIGHT
      })

      await inputEvent
      await tableMaxDepthChanged

      expect(
        workspace.getConfiguration().get(ConfigKey.EXP_TABLE_HEAD_MAX_HEIGHT)
      ).to.equal(0)
      expect(mockSendTelemetryEvent).to.be.called
      expect(
        mockSendTelemetryEvent,
        'should send a telemetry call that tells you the max height has been updated'
      ).to.be.calledWithExactly(
        EventName.VIEWS_EXPERIMENTS_TABLE_SET_MAX_HEADER_HEIGHT,
        undefined,
        undefined
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should be able to handle a message to toggle an experiment's star status", async () => {
      const { experiments, experimentsModel } =
        setupExperimentsAndMockCommands()

      const experimentsToToggle = ['exp-e7a67']

      const areExperimentsStarred = (expIds: string[]): boolean =>
        expIds
          .map(expId =>
            experimentsModel.getCombinedList().find(({ id }) => id === expId)
          )
          .every(exp => exp?.starred)

      expect(
        areExperimentsStarred(experimentsToToggle),
        'experiments are starred'
      ).to.be.false

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const toggleSpy = spy(experimentsModel, 'toggleStars')

      mockMessageReceived.fire({
        payload: experimentsToToggle,
        type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      })

      expect(toggleSpy).to.be.calledWith(experimentsToToggle)
      toggleSpy.resetHistory()

      expect(
        areExperimentsStarred(experimentsToToggle),
        'experiments have been starred'
      ).to.be.true
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to filter to starred experiments', async () => {
      const { experiments } = setupExperimentsAndMockCommands()

      const mockExecuteCommand = stub(commands, 'executeCommand')

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const messageReceived = new Promise(resolve =>
        disposable.track(mockMessageReceived.event(() => resolve(undefined)))
      )

      mockMessageReceived.fire({
        type: MessageFromWebviewType.ADD_STARRED_EXPERIMENT_FILTER
      })

      await messageReceived

      expect(mockExecuteCommand).to.be.calledWithExactly(
        RegisteredCommands.EXPERIMENT_FILTER_ADD_STARRED,
        dvcDemoPath
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to select experiments for plotting', async () => {
      const { experiments, experimentsModel } =
        stubWorkspaceExperimentsGetters(disposable)
      await experiments.isReady()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const queuedId = '90aea7f'
      const runningInQueueId = 'exp-e7a67'
      const expectedIds = ['main', 'test-branch', runningInQueueId]
      const mockExperimentIds = [...expectedIds, queuedId]

      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        payload: mockExperimentIds,
        type: MessageFromWebviewType.SET_EXPERIMENTS_FOR_PLOTS
      })

      await tableChangePromise

      const selectExperimentIds = experimentsModel
        .getSelectedRevisions()
        .map(({ id }) => id)
        .sort()
      expectedIds.sort()
      expect(
        selectExperimentIds,
        'should exclude queued experiments and experiments running in the queue from selection'
      ).to.deep.equal(expectedIds)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to compare experiments plots', async () => {
      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: true,
        experiments: true
      })
      const { experiments, experimentsModel } =
        stubWorkspaceExperimentsGetters(disposable)
      const mockShowPlots = stub(WorkspacePlots.prototype, 'showWebview')

      const dataSent = new Promise(resolve =>
        mockShowPlots.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      )

      await experiments.isReady()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const runningInQueueId = 'exp-e7a67'
      const mockExperimentIds = ['main', 'test-branch', runningInQueueId]

      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        payload: mockExperimentIds,
        type: MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS
      })

      await Promise.all([tableChangePromise, dataSent])

      const selectExperimentIds = experimentsModel
        .getSelectedRevisions()
        .map(({ id }) => id)
        .sort()
      expect(selectExperimentIds).to.deep.equal([...mockExperimentIds].sort())
      expect(mockShowPlots).to.be.calledOnce
      expect(mockShowPlots).to.be.calledWith(dvcDemoPath)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to open the plots webview', async () => {
      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: true,
        experiments: true
      })
      const { experiments } = buildExperiments({
        disposer: disposable
      })
      const mockShowPlots = stub(WorkspacePlots.prototype, 'showWebview')
      const webviewOpened = new Promise(resolve =>
        mockShowPlots.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      )

      await experiments.isReady()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.OPEN_PLOTS_WEBVIEW
      })

      await webviewOpened

      expect(mockShowPlots).to.be.calledOnce
      expect(mockShowPlots).to.be.calledWith(dvcDemoPath)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to stop experiments running', async () => {
      const { experiments, dvcExecutor } =
        stubWorkspaceExperimentsGetters(disposable)

      const mockQueueKill = stub(dvcExecutor, 'queueKill')
      const mockStopProcesses = stub(ProcessExecution, 'stopProcesses')

      const experimentsKilled = new Promise(resolve =>
        mockQueueKill.callsFake(() => {
          resolve(undefined)
          return Promise.resolve('')
        })
      )

      const workspaceStopped = new Promise(resolve =>
        mockStopProcesses.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(true)
        })
      )

      await experiments.isReady()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentIds = ['exp-e7a67', 'exp-83425']

      const mockPid = 1234
      const mockGetPidFromFile = stub(FileSystem, 'getPidFromFile')
        .onFirstCall()
        .resolves(mockPid)
        .onSecondCall()
        .resolves(undefined)
      const mockProcessExists = stub(
        ProcessExecution,
        'processExists'
      ).resolves(true)

      mockMessageReceived.fire({
        payload: mockExperimentIds,
        type: MessageFromWebviewType.STOP_EXPERIMENTS
      })

      await Promise.all([experimentsKilled, workspaceStopped])

      expect(mockQueueKill).to.be.calledWith(dvcDemoPath, 'exp-e7a67')
      expect(mockGetPidFromFile).to.be.calledTwice
      expect(mockProcessExists).to.be.calledWithExactly(mockPid)
      expect(mockStopProcesses).to.be.calledWithExactly([mockPid])
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to add a configuration', async () => {
      const { experiments, mockCheckOrAddPipeline, messageSpy } =
        setupExperimentsAndMockCommands()

      const webview = await experiments.showWebview()
      messageSpy.resetHistory()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.ADD_CONFIGURATION
      })

      expect(mockCheckOrAddPipeline).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to show more commits', async () => {
      const {
        experiments,
        experimentsModel,
        messageSpy,
        mockUpdateExperimentsData
      } = setupExperimentsAndMockCommands()

      const setNbfCommitsToShowSpy = spy(
        experimentsModel,
        'setNbfCommitsToShow'
      )

      const webview = await experiments.showWebview()
      messageSpy.resetHistory()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        payload: 'main',
        type: MessageFromWebviewType.SHOW_MORE_COMMITS
      })

      expect(mockUpdateExperimentsData).to.be.calledOnce
      expect(setNbfCommitsToShowSpy).to.be.calledWith(7, 'main')
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to show less commits', async () => {
      const {
        experiments,
        experimentsModel,
        messageSpy,
        mockUpdateExperimentsData
      } = setupExperimentsAndMockCommands()

      const setNbfCommitsToShowSpy = spy(
        experimentsModel,
        'setNbfCommitsToShow'
      )

      const webview = await experiments.showWebview()
      messageSpy.resetHistory()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        payload: 'main',
        type: MessageFromWebviewType.SHOW_LESS_COMMITS
      })

      expect(mockUpdateExperimentsData).to.be.calledOnce
      expect(setNbfCommitsToShowSpy).to.be.calledWith(3, 'main')
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to select branches', async () => {
      const {
        experiments,
        experimentsModel,
        messageSpy,
        mockUpdateExperimentsData,
        mockSelectBranches
      } = setupExperimentsAndMockCommands()
      const mockSetSelectedBranches = stub(
        experimentsModel,
        'setSelectedBranches'
      )

      const waitForBranchesToBeSelected = new Promise(resolve =>
        mockSetSelectedBranches.callsFake(() => resolve(undefined))
      )

      const webview = await experiments.showWebview()
      messageSpy.resetHistory()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.SELECT_BRANCHES
      })

      expect(mockSelectBranches).to.be.calledOnce

      await waitForBranchesToBeSelected

      expect(mockSetSelectedBranches).to.be.calledOnceWith(['main', 'other'])

      expect(mockUpdateExperimentsData).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to refresh the exp show data', async () => {
      const { experiments, mockUpdateExperimentsData } = buildExperiments({
        disposer: disposable,
        expShow: expShowFixture
      })

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const expShowCalled = new Promise(resolve =>
        mockUpdateExperimentsData.callsFake(() => {
          resolve(undefined)
          return Promise.resolve([])
        })
      )

      mockMessageReceived.fire({
        type: MessageFromWebviewType.REFRESH_EXP_DATA
      })

      await expShowCalled
      expect(mockUpdateExperimentsData).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should not update the selected branches when the user closes the select branches quick pick', async () => {
      const {
        experiments,
        experimentsModel,
        messageSpy,
        mockUpdateExperimentsData,
        mockSelectBranches
      } = setupExperimentsAndMockCommands()
      const mockSetBranches = stub(experimentsModel, 'setBranches')
      mockSelectBranches.resolves(undefined)

      const webview = await experiments.showWebview()
      messageSpy.resetHistory()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.SELECT_BRANCHES
      })

      expect(mockSelectBranches).to.be.calledOnce

      expect(mockSetBranches).not.to.be.calledOnceWith('main', [
        'main',
        'other'
      ])

      expect(mockUpdateExperimentsData).not.to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })

  describe('Sorting', () => {
    it('should be able to sort', async () => {
      const { dvcReader, internalCommands } = buildInternalCommands(disposable)

      const messageSpy = spy(BaseWebview.prototype, 'show')

      const resourceLocator = disposable.track(
        new ResourceLocator(extensionUri)
      )
      stub(dvcReader, 'stageList').resolves('train')
      stub(dvcReader, 'dag').resolves('')

      const pipeline = buildExperimentsPipeline({
        disposer: disposable,
        dvcRoot: dvcDemoPath,
        internalCommands
      })

      const experiments = disposable.track(
        new Experiments(
          dvcDemoPath,
          internalCommands,
          pipeline,
          resourceLocator,
          buildMockMemento(),
          () => Promise.resolve([]),
          buildMockExperimentsData()
        )
      )

      const data = generateTestExpShowOutput(
        {},
        {
          rev: '2d879497587b80b2d9e61f072d9dbe9c07a65357',
          experiments: [
            {
              params: {
                'params.yaml': {
                  data: {
                    test: 2
                  }
                }
              }
            },
            {
              params: {
                'params.yaml': {
                  data: {
                    test: 1
                  }
                }
              }
            },
            {
              params: {
                'params.yaml': {
                  data: {
                    test: 3
                  }
                }
              }
            }
          ]
        }
      )

      void experiments.setState({
        availableNbCommits: { main: 20 },
        gitLog: '',
        expShow: data,
        rowOrder: [
          { sha: '2d879497587b80b2d9e61f072d9dbe9c07a65357', branch: 'main' }
        ]
      })

      messageSpy.resetHistory()

      await experiments.isReady()
      await experiments.showWebview()

      const getIds = (rows: Commit[]) =>
        rows.map(({ id, subRows }) => {
          const data: { id: string; subRows?: string[] } = { id }

          if (subRows) {
            data.subRows = subRows.map(({ id }) => id)
          }
          return data
        })

      const { rows, sorts: noSorts } = messageSpy.lastCall.args[0]

      expect(getIds(rows as Commit[])).to.deep.equal([
        { id: EXPERIMENT_WORKSPACE_ID },
        {
          id: '2d879497587b80b2d9e61f072d9dbe9c07a65357',
          subRows: ['exp-1', 'exp-2', 'exp-3']
        }
      ])

      expect(noSorts).to.deep.equal([])

      const mockShowQuickPick = stub(window, 'showQuickPick')
      const sortPath = buildMetricOrParamPath(
        ColumnType.PARAMS,
        'params.yaml',
        'test'
      )

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

      const { rows: sortedRows, sorts } = messageSpy.lastCall.args[0]

      expect(getIds(sortedRows as Commit[])).to.deep.equal([
        { id: EXPERIMENT_WORKSPACE_ID },
        {
          id: '2d879497587b80b2d9e61f072d9dbe9c07a65357',
          subRows: ['exp-2', 'exp-1', 'exp-3']
        }
      ])

      expect(sorts).to.deep.equal([{ descending: false, path: sortPath }])
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })

  describe('persisted state', () => {
    const firstSortDefinition = {
      descending: false,
      path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'test')
    }
    const secondSortDefinition = {
      descending: true,
      path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'other')
    }
    const sortDefinitions: SortDefinition[] = [
      firstSortDefinition,
      secondSortDefinition
    ]

    const firstFilterId = buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'test==1'
    )
    const firstFilterDefinition = {
      operator: Operator.EQUAL,
      path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'test'),
      value: 1
    }
    const secondFilterId = buildMetricOrParamPath(
      ColumnType.PARAMS,
      'params.yaml',
      'other∈testcontains'
    )
    const secondFilterDefinition = {
      operator: Operator.CONTAINS,
      path: buildMetricOrParamPath(ColumnType.PARAMS, 'params.yaml', 'other'),
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
      const { internalCommands } = buildInternalCommands(disposable)
      const colors = copyOriginalColors()
      const mockMemento = buildMockMemento()
      const mementoSpy = spy(mockMemento, 'get')

      const testRepository = disposable.track(
        new Experiments(
          'test',
          internalCommands,
          {
            hasStage: () => true,
            isReady: () => Promise.resolve(),
            onDidUpdate: stub()
          } as unknown as Pipeline,
          {} as ResourceLocator,
          mockMemento,
          () => Promise.resolve([]),
          buildMockExperimentsData()
        )
      )
      void testRepository.setState(DEFAULT_EXPERIMENTS_OUTPUT)
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
        'Memento starts with the status keys'
      ).to.deep.equal(['experimentsStatus:test', 'columnsColumnOrder:test'])

      expect(
        mockMemento.get('experimentsStatus:test'),
        'the correct statuses are persisted'
      ).to.deep.equal({
        '489fd8b': 0,
        '55d492c': 0,
        '7df876c': 0,
        'exp-83425': colors[0],
        'exp-e7a67': 0,
        'exp-f13bca': 0,
        fe2919b: 0,
        main: 0,
        'test-branch': 0,
        [EXPERIMENT_WORKSPACE_ID]: 0
      })

      expect(
        mockMemento.get('columnsColumnOrder:test'),
        'the columns order is added to memento'
      ).to.deep.equal(columnsOrderFixture)

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
        .resolves([
          getFilterId(firstFilterDefinition),
          getFilterId(secondFilterDefinition)
        ])
      await testRepository.removeFilters()
      expect(
        mockMemento.get('experimentsFilterBy:test'),
        'both filters should be removed from memento after removeFilters is run against them'
      ).to.deep.equal([])

      testRepository.toggleExperimentStatus('exp-f13bca')
      expect(
        mockMemento.get('experimentsStatus:test'),
        'the correct statuses have been recorded in the memento'
      ).to.deep.equal({
        '489fd8b': 0,
        '55d492c': 0,
        '7df876c': 0,
        'exp-83425': colors[0],
        'exp-e7a67': 0,
        'exp-f13bca': colors[1],
        fe2919b: 0,
        main: 0,
        'test-branch': 0,
        [EXPERIMENT_WORKSPACE_ID]: 0
      })
    })

    it('should initialize with state reflected from the given Memento', async () => {
      const { internalCommands } = buildInternalCommands(disposable)
      const colors = copyOriginalColors()
      const mockMemento = buildMockMemento({
        'experimentsFilterBy:test': filterMapEntries,
        'experimentsSortBy:test': sortDefinitions,
        'experimentsStatus:test': {
          'exp-83425': colors[0],
          'exp-e7a67': colors[5],
          'exp-f13bca': 0,
          'test-branch': colors[1]
        }
      })

      const mementoSpy = spy(mockMemento, 'get')
      const testRepository = disposable.track(
        new Experiments(
          'test',
          internalCommands,
          {
            hasStage: () => true,
            isReady: () => Promise.resolve(),
            onDidUpdate: stub()
          } as unknown as Pipeline,
          {} as ResourceLocator,
          mockMemento,
          () => Promise.resolve([]),
          buildMockExperimentsData()
        )
      )
      void testRepository.setState(DEFAULT_EXPERIMENTS_OUTPUT)
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
        .getSelectedRevisions()
        .map(({ displayColor, id }) => ({ displayColor, id }))
      expect(
        selected,
        'should retain the order that the experiments were selected in'
      ).to.deep.equal([
        {
          displayColor: colors[0],
          id: 'exp-83425'
        },
        {
          displayColor: colors[1],
          id: 'test-branch'
        },
        {
          displayColor: colors[5],
          id: 'exp-e7a67'
        }
      ])
    })
  })

  describe('editor/title icons', () => {
    it('should set the appropriate context value when a params file is open in the active editor/closed', async () => {
      const paramsFile = Uri.file(join(dvcDemoPath, 'params.yaml'))
      await window.showTextDocument(paramsFile)

      const mockContext: { [key: string]: unknown } = {
        'dvc.experiments.file.active': false
      }

      const mockSetContextValue = stub(VscodeContext, 'setContextValue')
      mockSetContextValue.callsFake((key: string, value: unknown) => {
        mockContext[key] = value
        return Promise.resolve(undefined)
      })

      const { experiments } = buildExperiments({ disposer: disposable })
      await experiments.isReady()

      expect(
        mockContext['dvc.experiments.file.active'],
        'should set dvc.experiments.file.active to true when a params file is open and the extension starts'
      ).to.be.true

      mockSetContextValue.resetHistory()

      const startupEditorClosed = getActiveEditorUpdatedEvent(disposable)

      await closeAllEditors()
      await startupEditorClosed

      expect(
        mockContext['dvc.experiments.file.active'],
        'should set dvc.experiments.file.active to false when the params file in the active editor is closed'
      ).to.be.false

      mockSetContextValue.resetHistory()

      const activeEditorUpdated = getActiveEditorUpdatedEvent(disposable)

      await window.showTextDocument(paramsFile)
      await activeEditorUpdated

      const activeEditorClosed = getActiveEditorUpdatedEvent(disposable)

      expect(
        mockContext['dvc.experiments.file.active'],
        'should set dvc.experiments.file.active to true when a params file is in the active editor'
      ).to.be.true

      await closeAllEditors()
      await activeEditorClosed

      expect(
        mockContext['dvc.experiments.file.active'],
        'should set dvc.experiments.file.active to false when the params file in the active editor is closed again'
      ).to.be.false
    })

    it('should not set a context value when a non-params file is open and the extension starts', async () => {
      const nonParamsFile = Uri.file(join(dvcDemoPath, '.gitignore'))
      await window.showTextDocument(nonParamsFile)

      const setContextValueSpy = spy(VscodeContext, 'setContextValue')

      const { experiments } = buildExperiments({ disposer: disposable })
      await experiments.isReady()

      expect(setContextValueSpy).not.to.be.calledWith(
        'dvc.experiments.file.active'
      )
    })
  })

  describe('Empty repository', () => {
    it('should not show any experiments in the experiments tree when there are no columns', async () => {
      const rev = 'b9f016df00d499f6d2a73e7dc34d1600c78066eb'
      const data = generateTestExpShowOutput({}, { rev })
      const { experiments } = buildExperiments({
        disposer: disposable,
        expShow: data,
        dvcRoot: dvcDemoPath,
        gitLog: '',
        rowOrder: [{ sha: rev, branch: 'funkyBranch' }]
      })
      await experiments.isReady()

      expect(
        experiments.getWorkspaceAndCommits(),
        'should send no experiments to the tree'
      ).to.deep.equal([])
      expect(
        experiments.getSelectedRevisions(),
        'should show 0 selected experiments as selected in the description'
      ).to.deep.equal([])
    })
  })

  describe('setState', () => {
    it('should clean up after a killed DVCLive process that was running an experiment outside of the DVC context', async () => {
      const defaultExperimentsData = generateTestExpShowOutput({})

      const { experiments, mockCheckSignalFile, mockUpdateExperimentsData } =
        buildExperiments({
          disposer: disposable,
          expShow: defaultExperimentsData,
          dvcRoot: dvcDemoPath,
          gitLog: '',
          rowOrder: []
        })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getCleanupInitialized = (experiments: any) =>
        experiments.dvcLiveOnlyCleanupInitialized

      await experiments.isReady()

      const mockDelay = stub(Time, 'delay')
      mockDelay.callsFake(() => mockDelay.wrappedMethod(500))

      let processKilled = false

      const cleanupUpdate = new Promise(resolve =>
        mockUpdateExperimentsData.callsFake(() => resolve(undefined))
      )

      mockCheckSignalFile.resetBehavior()
      mockCheckSignalFile.callsFake(() => {
        return Promise.resolve(!processKilled)
      })

      const dataUpdated = new Promise(resolve =>
        disposable.track(
          experiments.onDidChangeExperiments(() => resolve(undefined))
        )
      )

      void experiments.setState({
        availableNbCommits: { main: 20 },
        gitLog: '',
        expShow: defaultExperimentsData,
        rowOrder: []
      })
      await dataUpdated
      expect(experiments.hasRunningWorkspaceExperiment()).to.be.true
      expect(getCleanupInitialized(experiments)).to.be.true

      processKilled = true

      mockUpdateExperimentsData.resetHistory()

      await cleanupUpdate

      expect(getCleanupInitialized(experiments)).to.be.false
      expect(mockCheckSignalFile).to.be.called
      expect(mockDelay).to.be.called
      expect(mockUpdateExperimentsData).to.be.calledOnce
    })
  })
})
