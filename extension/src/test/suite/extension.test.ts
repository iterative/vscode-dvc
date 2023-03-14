import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import { commands, workspace } from 'vscode'
import { closeAllEditors, mockDisposable, mockDuration } from './util'
import { mockHasCheckpoints } from './experiments/util'
import { Disposable } from '../../extension'
import * as Python from '../../extensions/python'
import { DvcReader } from '../../cli/dvc/reader'
import expShowFixture from '../fixtures/expShow/base/output'
import plotsDiffFixture from '../fixtures/plotsDiff/output'
import * as Disposer from '../../util/disposable'
import { RegisteredCommands } from '../../commands/external'
import * as Telemetry from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { OutputChannel } from '../../vscode/outputChannel'
import { WorkspaceExperiments } from '../../experiments/workspace'
import { GitReader } from '../../cli/git/reader'
import { MIN_CLI_VERSION } from '../../cli/dvc/contract'
import { ConfigKey, setConfigValue } from '../../vscode/config'
import { DvcExecutor } from '../../cli/dvc/executor'
import { dvcDemoPath } from '../util'
import { Setup } from '../../setup'
import { Flag } from '../../cli/dvc/constants'

suite('Extension Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    disposable.dispose()
    return Promise.all([
      workspace.getConfiguration().update(ConfigKey.DVC_PATH, undefined, false),
      workspace
        .getConfiguration()
        .update(ConfigKey.PYTHON_PATH, undefined, false),
      closeAllEditors()
    ])
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('dvc.setupWorkspace', () => {
    it('should initialize the extension when the cli is usable', async () => {
      stub(Python, 'isPythonExtensionInstalled').returns(true)

      const mockCreateFileSystemWatcher = stub(
        workspace,
        'createFileSystemWatcher'
      ).returns({
        dispose: () => undefined,
        ignoreChangeEvents: false,
        ignoreCreateEvents: false,
        ignoreDeleteEvents: false,
        onDidChange: () => mockDisposable,
        onDidCreate: () => mockDisposable,
        onDidDelete: () => mockDisposable
      })

      const mockCanRunCli = stub(DvcReader.prototype, 'version')

      mockCanRunCli.resolves(MIN_CLI_VERSION)

      const mockDisposer = stub(Disposer, 'reset')

      const disposalEvent = () =>
        new Promise(resolve => {
          mockDisposer.resetBehavior()
          mockDisposer.resetHistory()
          mockDisposer.callsFake((disposables, untrack) => {
            resolve(undefined)
            for (const repository of Object.values(disposables)) {
              untrack(repository)
              disposable.track(repository)
            }
            return {}
          })
        })

      const firstDisposal = disposalEvent()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const correctTelemetryEventSent = new Promise(resolve =>
        mockSendTelemetryEvent.callsFake((eventName: string) => {
          if (eventName === EventName.EXTENSION_EXECUTION_DETAILS_CHANGED) {
            resolve(undefined)
          }
        })
      )

      mockHasCheckpoints(expShowFixture)
      const mockExpShow = stub(DvcReader.prototype, 'expShow')
      const mockDataStatus = stub(DvcReader.prototype, 'dataStatus')
      const mockPlotsDiff = stub(DvcReader.prototype, 'plotsDiff')

      stub(DvcReader.prototype, 'root').resolves('.')

      const dataStatusCalled = new Promise(resolve => {
        mockDataStatus.callsFake(() => {
          resolve(undefined)
          return Promise.resolve({
            committed: {
              added: [],
              deleted: [],
              modified: [],
              renamed: []
            },
            not_in_cache: [],
            unchanged: [
              join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
              join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
              join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
              join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
              join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
              join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
              join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
              join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
              join('logs', 'acc.tsv'),
              join('logs', 'loss.tsv')
            ],
            uncommitted: {
              added: [],
              deleted: [],
              modified: ['model.pt', join('data', 'MNIST', 'raw'), 'logs'],
              renamed: []
            }
          })
        })
      })

      const expShowCalled = new Promise(resolve => {
        mockExpShow.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(expShowFixture)
        })
      })

      const plotsDiffCalled = new Promise(resolve => {
        mockPlotsDiff.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(plotsDiffFixture)
        })
      })

      const mockWorkspaceExperimentsReady = stub(
        WorkspaceExperiments.prototype,
        'isReady'
      )

      stub(GitReader.prototype, 'hasChanges').resolves(false)
      stub(GitReader.prototype, 'listUntracked').resolves(new Set())

      const workspaceExperimentsAreReady = new Promise(resolve =>
        mockWorkspaceExperimentsReady.callsFake(async () => {
          await mockWorkspaceExperimentsReady.wrappedMethod()
          resolve(undefined)
        })
      )

      const mockPath = resolve('path', 'to', 'venv')

      await setConfigValue(ConfigKey.PYTHON_PATH, mockPath)

      await Promise.all([
        firstDisposal,
        correctTelemetryEventSent,
        dataStatusCalled,
        expShowCalled,
        plotsDiffCalled
      ])

      expect(
        await workspace.getConfiguration().get(ConfigKey.PYTHON_PATH)
      ).to.equal(mockPath)

      expect(
        mockCanRunCli,
        'should have checked to see if the cli could be run with the given execution details'
      ).to.have.been.called
      expect(mockDataStatus, 'should have updated the repository data').to.have
        .been.called
      expect(mockExpShow, 'should have updated the experiments data').to.have
        .been.called
      expect(mockPlotsDiff, 'should have updated the plots data').to.have.been
        .called

      expect(
        mockDisposer,
        'should dispose of the current repositories and experiments before creating new ones'
      ).to.have.been.called

      await workspaceExperimentsAreReady
      const secondDisposal = disposalEvent()

      mockCanRunCli.resetBehavior()
      mockCanRunCli.rejects('CLI is gone, dispose of everything')

      await setConfigValue(
        ConfigKey.PYTHON_PATH,
        resolve('path', 'to', 'virtualenv')
      )

      await secondDisposal

      expect(
        mockDisposer,
        'should dispose of the current repositories and experiments if the cli can no longer be found'
      ).to.have.been.called

      expect(mockCreateFileSystemWatcher).not.to.be.calledWithMatch('{}')
    }).timeout(25000)
  })

  describe('dvc.stopAllRunningExperiments', () => {
    it('should send a telemetry event containing properties relating to the event', async () => {
      stub(DvcReader.prototype, 'listStages').resolves('train')

      const duration = 1234
      const otherRoot = resolve('other', 'root')
      mockDuration(duration)

      const mockQueueStop = stub(DvcExecutor.prototype, 'queueStop').resolves(
        undefined
      )

      stub(Setup.prototype, 'getRoots').returns([dvcDemoPath, otherRoot])

      await commands.executeCommand(RegisteredCommands.STOP_EXPERIMENTS)
      expect(mockQueueStop).to.be.calledWith(dvcDemoPath, Flag.KILL)
      expect(mockQueueStop).to.be.calledWith(otherRoot, Flag.KILL)
    })
  })

  describe('dvc.showCommands', () => {
    it('should show all of the dvc commands without error', async () => {
      await expect(
        commands.executeCommand(RegisteredCommands.EXTENSION_SHOW_COMMANDS)
      ).to.be.eventually.equal(undefined)
    })
  })

  describe('dvc.showOutput', () => {
    it('should be able to show the output channel', async () => {
      const showOutputSpy = spy(OutputChannel.prototype, 'show')
      await commands.executeCommand(RegisteredCommands.EXTENSION_SHOW_OUTPUT)
      expect(showOutputSpy).to.have.been.calledOnce
    })
  })

  describe('view container', () => {
    it('should be able to focus the experiments view container', async () => {
      await expect(
        commands.executeCommand('workbench.view.extension.dvc-views')
      ).to.be.eventually.equal(undefined)
    })
  })
})
