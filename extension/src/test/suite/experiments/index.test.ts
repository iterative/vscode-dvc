import { join, resolve } from 'path'
import { after, afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, spy, restore, SinonStub } from 'sinon'
import {
  EventEmitter,
  window,
  commands,
  workspace,
  Uri,
  QuickPickItem,
  ViewColumn
} from 'vscode'
import { buildExperiments, stubWorkspaceExperimentsGetters } from './util'
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
  TableData
} from '../../../experiments/webview/contract'
import {
  buildInternalCommands,
  buildMockData,
  closeAllEditors,
  configurationChangeEvent,
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
import { buildMetricOrParamPath } from '../../../experiments/columns/paths'
import { BaseWebview } from '../../../webview'
import { ColumnsModel } from '../../../experiments/columns/model'
import { MessageFromWebviewType } from '../../../webview/contract'
import { ExperimentsModel } from '../../../experiments/model'
import { copyOriginalColors } from '../../../experiments/model/status/colors'
import { FileSystemData } from '../../../fileSystem/data'
import { ExperimentsData } from '../../../experiments/data'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import * as Telemetry from '../../../telemetry'
import { EventName } from '../../../telemetry/constants'
import * as VscodeContext from '../../../vscode/context'
import { Title } from '../../../vscode/title'
import { ExperimentFlag } from '../../../cli/dvc/constants'
import { DvcExecutor } from '../../../cli/dvc/executor'
import { shortenForLabel } from '../../../util/string'
import { GitExecutor } from '../../../cli/git/executor'
import { WorkspacePlots } from '../../../plots/workspace'
import { PlotSizeNumber } from '../../../plots/webview/contract'
import { RegisteredCommands } from '../../../commands/external'
import { ConfigKey } from '../../../vscode/config'
import { EXPERIMENT_WORKSPACE_ID } from '../../../cli/dvc/contract'
import * as Time from '../../../util/time'
import { AvailableCommands } from '../../../commands/internal'

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
      const { experiments } = buildExperiments(disposable)

      await experiments.isReady()

      const runs = experiments.getWorkspaceAndCommits()

      expect(runs.map(experiment => experiment.label)).to.deep.equal([
        EXPERIMENT_WORKSPACE_ID,
        'main'
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
        columnOrder: columnsOrderFixture,
        columnWidths: {},
        columns: columnsFixture,
        filteredCounts: { checkpoints: 0, experiments: 0 },
        filters: [],
        hasCheckpoints: true,
        hasColumns: true,
        hasRunningExperiment: true,
        rows: rowsFixture,
        sorts: []
      }

      expect(messageSpy).to.be.calledWithExactly(expectedTableData)

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
        messageSpy
      } = buildExperiments(disposable, expShowFixture)
      const mockExecuteCommand = stub(
        internalCommands,
        'executeCommand'
      ).callsFake(commandId =>
        commandId === AvailableCommands.GIT_GET_COMMIT_MESSAGES
          ? Promise.resolve('')
          : Promise.resolve(undefined)
      )
      return {
        columnsModel,
        dvcExecutor,
        experiments,
        experimentsModel,
        messageSpy,
        mockExecuteCommand
      }
    }

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

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
      const mockWidth = PlotSizeNumber.REGULAR

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to hide a table column', async () => {
      const { experiments, columnsModel } = buildExperiments(disposable)

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
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'exp-e7a67'

      const mockExperimentApply = stub(
        DvcExecutor.prototype,
        'experimentApply'
      ).resolves(undefined)

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

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
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const mockBranch = 'mock-branch-input'
      const inputEvent = getInputBoxEvent(mockBranch)

      const mockExperimentBranch = stub(
        DvcExecutor.prototype,
        'experimentBranch'
      ).resolves('undefined')

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

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

    it('should handle a message to share an experiment as a new branch', async () => {
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const testCheckpointId = 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9'
      const testCheckpointLabel = shortenForLabel(testCheckpointId)
      const mockBranch = 'it-is-a-branch-shared-to-the-remote'
      const inputEvent = getInputBoxEvent(mockBranch)

      const mockExperimentBranch = stub(
        DvcExecutor.prototype,
        'experimentBranch'
      ).resolves(
        `Git branch '${mockBranch}' has been created from experiment '${testCheckpointId}'.        
       To switch to the new branch run:
             git checkout ${mockBranch}`
      )
      const mockExperimentApply = stub(
        DvcExecutor.prototype,
        'experimentApply'
      ).resolves(
        `Changes for experiment '${testCheckpointId}' have been applied to your current workspace.`
      )
      const mockPush = stub(DvcExecutor.prototype, 'push').resolves(
        '10 files updated.'
      )
      const mockGitPush = stub(GitExecutor.prototype, 'pushBranch')
      const branchPushedToRemote = new Promise(resolve =>
        mockGitPush.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(`${mockBranch} pushed to remote`)
        })
      )

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        payload: testCheckpointId,
        type: MessageFromWebviewType.SHARE_EXPERIMENT_AS_BRANCH
      })

      await inputEvent
      await branchPushedToRemote
      expect(mockExperimentBranch).to.be.calledWithExactly(
        dvcDemoPath,
        testCheckpointLabel,
        mockBranch
      )
      expect(mockExperimentApply).to.be.calledWithExactly(
        dvcDemoPath,
        testCheckpointLabel
      )
      expect(mockPush).to.be.calledWithExactly(dvcDemoPath)
      expect(mockGitPush).to.be.calledWithExactly(dvcDemoPath, mockBranch)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to share an experiment as a commit', async () => {
      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      const testCheckpointId = 'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9'
      const testCheckpointLabel = shortenForLabel(testCheckpointId)
      const mockCommitMessage =
        'this is the very best version that I could come up with'
      const inputEvent = getInputBoxEvent(mockCommitMessage)

      const mockExperimentApply = stub(
        DvcExecutor.prototype,
        'experimentApply'
      ).resolves(
        `Changes for experiment '${testCheckpointId}' have been applied to your current workspace.`
      )
      const mockStageAndCommit = stub(
        GitExecutor.prototype,
        'stageAndCommit'
      ).resolves(`[current-branch 67effdbc] ${mockCommitMessage}`)

      const mockPush = stub(DvcExecutor.prototype, 'push').resolves(
        '100000 files updated.'
      )
      const mockGitPush = stub(GitExecutor.prototype, 'pushBranch')
      const branchPushedToRemote = new Promise(resolve =>
        mockGitPush.callsFake(() => {
          resolve(undefined)
          return Promise.resolve('current-branch pushed to remote')
        })
      )

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockMessageReceived.fire({
        payload: testCheckpointId,
        type: MessageFromWebviewType.SHARE_EXPERIMENT_AS_COMMIT
      })

      await inputEvent
      await branchPushedToRemote
      expect(mockStageAndCommit).to.be.calledWithExactly(
        dvcDemoPath,
        mockCommitMessage
      )
      expect(mockExperimentApply).to.be.calledWithExactly(
        dvcDemoPath,
        testCheckpointLabel
      )
      expect(mockPush).to.be.calledWithExactly(dvcDemoPath)
      expect(mockGitPush).to.be.calledWithExactly(dvcDemoPath)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should be able to handle a message to modify an experiment's params and queue an experiment", async () => {
      const { experiments, dvcExecutor } = buildExperiments(disposable)

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.001',
        '-S',
        'params.yaml:weight_decay=0'
      ]

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)
      const mockQueueExperiment = stub(
        dvcExecutor,
        'experimentRunQueue'
      ).resolves(undefined)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'
      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE
      })

      await tableChangePromise
      expect(mockQueueExperiment).to.be.calledOnce
      expect(mockQueueExperiment).to.be.calledWithExactly(
        dvcDemoPath,
        ...mockModifiedParams
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should be able to handle a message to modify an experiment's params and run a new experiment", async () => {
      const { experiments, dvcRunner } = buildExperiments(disposable)

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.001',
        '-S',
        'params.yaml:weight_decay=0'
      ]

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)
      const mockRunExperiment = stub(dvcRunner, 'runExperiment').resolves(
        undefined
      )

      const webview = await experiments.showWebview()

      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'

      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_RUN
      })

      await tableChangePromise
      expect(mockRunExperiment).to.be.calledOnce
      expect(mockRunExperiment).to.be.calledWithExactly(
        dvcDemoPath,
        ...mockModifiedParams
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should be able to handle a message to modify an experiment's params reset and run a new experiment", async () => {
      const { experiments, dvcRunner } = buildExperiments(disposable)

      const mockModifiedParams = [
        '-S',
        'params.yaml:lr=0.0001',
        '-S',
        'params.yaml:weight_decay=0.2'
      ]

      stub(experiments, 'pickAndModifyParams').resolves(mockModifiedParams)

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'
      const mockRunExperiment = stub(dvcRunner, 'runExperiment').resolves(
        undefined
      )

      const tableChangePromise = experimentsUpdatedEvent(experiments)

      mockMessageReceived.fire({
        payload: mockExperimentId,
        type: MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN
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
      const { experiments } = buildExperiments(disposable)

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentId = 'mock-experiment-id'

      const mockExperimentRemove = stub(
        DvcExecutor.prototype,
        'experimentRemove'
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
      const { experiments, experimentsModel } = buildExperiments(disposable)

      await experiments.isReady()

      const experimentToToggle = 'exp-e7a67'
      const queuedExperiment = '90aea7f2482117a55dfcadcdb901aaa6610fbbc9'

      const isExperimentSelected = (expId: string): boolean =>
        !!experimentsModel
          .getRecordsWithoutCheckpoints()
          .find(({ id }) => id === expId)?.selected

      expect(isExperimentSelected(experimentToToggle), 'experiment is selected')
        .to.be.true
      expect(
        isExperimentSelected(queuedExperiment),
        'queued experiment cannot be selected'
      ).to.be.false

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

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

      const allColumnsUnselected: TableData = {
        changes: workspaceChangesFixture,
        columnOrder: columnsOrderFixture,
        columnWidths: {},
        columns: [],
        filteredCounts: { checkpoints: 0, experiments: 0 },
        filters: [],
        hasCheckpoints: true,
        hasColumns: true,
        hasRunningExperiment: true,
        rows: rowsFixture,
        sorts: []
      }

      expect(messageSpy).to.be.calledWith(allColumnsUnselected)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to focus the sorts tree', async () => {
      const { experiments } = buildExperiments(disposable, expShowFixture)

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
      const { experiments } = buildExperiments(disposable, expShowFixture)

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
      const { experiments } = buildExperiments(disposable, expShowFixture)
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
            experimentsModel
              .getRecordsWithoutCheckpoints()
              .find(({ id }) => id === expId)
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
      const { experiments, experimentsModel } = buildExperiments(disposable)
      await experiments.isReady()

      const webview = await experiments.showWebview()
      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockExperimentIds = [
        'exp-e7a67',
        'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9',
        'test-branch'
      ]

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

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
      expect(selectExperimentIds).to.deep.equal(mockExperimentIds.sort())
      expect(selectExperimentIds).to.deep.equal(mockExperimentIds)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to handle a message to compare experiments plots', async () => {
      const { experiments, experimentsModel } = buildExperiments(disposable)
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
      const mockExperimentIds = [
        'exp-e7a67',
        'd1343a87c6ee4a2e82d19525964d2fb2cb6756c9',
        'test-branch'
      ]

      stubWorkspaceExperimentsGetters(dvcDemoPath, experiments)

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
      expect(selectExperimentIds).to.deep.equal(mockExperimentIds.sort())
      expect(mockShowPlots).to.be.calledOnce
      expect(mockShowPlots).to.be.calledWith(dvcDemoPath)
    }).timeout(WEBVIEW_TEST_TIMEOUT)
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

      void experiments.setState({
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: { data: buildTestExperiment(10) }
        },
        testBranch: {
          baseline: {
            data: { name: 'testBranch', ...buildTestExperiment(10) }
          },
          testExp1: { data: buildTestExperiment(2) },
          testExp2: { data: buildTestExperiment(1) },
          testExp3: { data: buildTestExperiment(3) }
        }
      })

      messageSpy.resetHistory()

      await experiments.isReady()
      await experiments.showWebview()

      expect(messageSpy).to.be.calledWithMatch({
        rows: [
          {
            displayColor: undefined,
            id: EXPERIMENT_WORKSPACE_ID,
            label: EXPERIMENT_WORKSPACE_ID,
            params: { 'params.yaml': { test: 10 } },
            selected: false,
            starred: false
          },
          {
            displayColor: undefined,
            id: 'testBranch',
            label: 'testBranch',
            name: 'testBranch',
            params: { 'params.yaml': { test: 10 } },
            selected: false,
            sha: 'testBranch',
            starred: false,
            subRows: [
              {
                displayColor: undefined,
                id: 'testExp1',
                label: 'testExp',
                params: { 'params.yaml': { test: 2 } },
                selected: false,
                sha: 'testExp1',
                starred: false
              },
              {
                displayColor: undefined,
                id: 'testExp2',
                label: 'testExp',
                params: { 'params.yaml': { test: 1 } },
                selected: false,
                sha: 'testExp2',
                starred: false
              },
              {
                displayColor: undefined,
                id: 'testExp3',
                label: 'testExp',
                params: { 'params.yaml': { test: 3 } },
                selected: false,
                sha: 'testExp3',
                starred: false
              }
            ]
          }
        ],
        sorts: []
      })

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

      expect(messageSpy).to.be.calledWithMatch({
        rows: [
          {
            displayColor: undefined,
            id: EXPERIMENT_WORKSPACE_ID,
            label: EXPERIMENT_WORKSPACE_ID,
            params: { 'params.yaml': { test: 10 } },
            selected: false,
            starred: false
          },
          {
            displayColor: undefined,
            id: 'testBranch',
            label: 'testBranch',
            name: 'testBranch',
            params: { 'params.yaml': { test: 10 } },
            selected: false,
            sha: 'testBranch',
            starred: false,
            subRows: [
              {
                displayColor: undefined,
                id: 'testExp2',
                label: 'testExp',
                params: { 'params.yaml': { test: 1 } },
                selected: false,
                sha: 'testExp2',
                starred: false
              },
              {
                displayColor: undefined,
                id: 'testExp1',
                label: 'testExp',
                params: { 'params.yaml': { test: 2 } },
                selected: false,
                sha: 'testExp1',
                starred: false
              },
              {
                displayColor: undefined,
                id: 'testExp3',
                label: 'testExp',
                params: { 'params.yaml': { test: 3 } },
                selected: false,
                sha: 'testExp3',
                starred: false
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
          {} as EventEmitter<boolean>,
          {} as ResourceLocator,
          mockMemento,
          buildMockData<ExperimentsData>(),
          buildMockData<FileSystemData>()
        )
      )
      void testRepository.setState(expShowFixture)
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
        '1ee5f2ecb0fa4d83cbf614386536344cf894dd53': 0,
        '217312476f8854dda1865450b737eb6bc7a3ba1b': 0,
        '22e40e1fa3c916ac567f69b85969e3066a91dda4': 0,
        '23250b33e3d6dd0e136262d1d26a2face031cb03': 0,
        '489fd8bdaa709f7330aac342e051a9431c625481': 0,
        '55d492c9c633912685351b32df91bfe1f9ecefb9': 0,
        '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15': 0,
        '9523bde67538cf31230efaff2dbc47d38a944ab5': 0,
        c658f8b14ac819ac2a5ea0449da6c15dbe8eb880: 0,
        d1343a87c6ee4a2e82d19525964d2fb2cb6756c9: 0,
        e821416bfafb4bc28b3e0a8ddb322505b0ad2361: 0,
        'exp-83425': 0,
        'exp-e7a67': colors[1],
        'exp-f13bca': 0,
        main: 0,
        'test-branch': 0,
        workspace: colors[0]
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
        '489fd8bdaa709f7330aac342e051a9431c625481': 0,
        '55d492c9c633912685351b32df91bfe1f9ecefb9': 0,
        '91116c1eae4b79cb1f5ab0312dfd9b3e43608e15': 0,
        '9523bde67538cf31230efaff2dbc47d38a944ab5': 0,
        c658f8b14ac819ac2a5ea0449da6c15dbe8eb880: 0,
        d1343a87c6ee4a2e82d19525964d2fb2cb6756c9: 0,
        e821416bfafb4bc28b3e0a8ddb322505b0ad2361: 0,
        'exp-83425': 0,
        'exp-e7a67': 0,
        'exp-f13bca': 0,
        main: 0,
        'test-branch': 0,
        workspace: colors[0]
      })
    })

    it('should initialize with state reflected from the given Memento', async () => {
      const { internalCommands } = buildInternalCommands(disposable)
      const colors = copyOriginalColors()
      const mockMemento = buildMockMemento({
        'experimentsFilterBy:test': filterMapEntries,
        'experimentsSortBy:test': sortDefinitions,
        'experimentsStatus:test': {
          '489fd8bdaa709f7330aac342e051a9431c625481': 0,
          '55d492c9c633912685351b32df91bfe1f9ecefb9': 0,
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
          {} as EventEmitter<boolean>,
          {} as ResourceLocator,
          mockMemento,
          buildMockData<ExperimentsData>(),
          buildMockData<FileSystemData>()
        )
      )
      void testRepository.setState(expShowFixture)
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

    it('should set the appropriate context value when a params file is open in the active editor/closed', async () => {
      const paramsFile = Uri.file(join(dvcDemoPath, 'params.yaml'))
      await window.showTextDocument(paramsFile)

      const mockContext: { [key: string]: unknown } = {
        'dvc.params.file.active': false
      }

      const mockSetContextValue = stub(VscodeContext, 'setContextValue')
      mockSetContextValue.callsFake((key: string, value: unknown) => {
        mockContext[key] = value
        return Promise.resolve(undefined)
      })

      const { experiments } = buildExperiments(disposable)
      await experiments.isReady()

      expect(
        mockContext['dvc.params.file.active'],
        'should set dvc.params.file.active to true when a params file is open and the extension starts'
      ).to.be.true

      mockSetContextValue.resetHistory()

      const startupEditorClosed = getActiveEditorUpdatedEvent()

      await closeAllEditors()
      await startupEditorClosed

      expect(
        mockContext['dvc.params.file.active'],
        'should set dvc.params.file.active to false when the params file in the active editor is closed'
      ).to.be.false

      mockSetContextValue.resetHistory()

      const activeEditorUpdated = getActiveEditorUpdatedEvent()

      await window.showTextDocument(paramsFile)
      await activeEditorUpdated

      const activeEditorClosed = getActiveEditorUpdatedEvent()

      expect(
        mockContext['dvc.params.file.active'],
        'should set dvc.params.file.active to true when a params file is in the active editor'
      ).to.be.true

      await closeAllEditors()
      await activeEditorClosed

      expect(
        mockContext['dvc.params.file.active'],
        'should set dvc.params.file.active to false when the params file in the active editor is closed again'
      ).to.be.false
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

  describe('Empty repository', () => {
    it('should not show any experiments in the experiments tree when there are no columns', async () => {
      const { experiments } = buildExperiments(disposable, {
        [EXPERIMENT_WORKSPACE_ID]: {
          baseline: {
            data: {
              deps: {}
            }
          }
        },
        b9f016df00d499f6d2a73e7dc34d1600c78066eb: {
          baseline: {
            data: {
              deps: {}
            }
          }
        }
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
      const defaultExperimentsData = { workspace: { baseline: { data: {} } } }

      const { experiments, mockCheckSignalFile, mockUpdateExperimentsData } =
        buildExperiments(disposable, defaultExperimentsData)

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

      void experiments.setState(defaultExperimentsData)
      await dataUpdated
      expect(experiments.hasRunningExperiment()).to.be.true
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
