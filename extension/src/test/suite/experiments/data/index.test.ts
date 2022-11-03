import { join, sep } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { EventEmitter, FileSystemWatcher, RelativePattern } from 'vscode'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import { Disposable } from '../../../../extension'
import expShowFixture from '../../../fixtures/expShow/base/output'
import {
  bypassProcessManagerDebounce,
  getFirstArgOfCall,
  getMockNow,
  stubPrivateMemberMethod
} from '../../util'
import { dvcDemoPath, getTestWorkspaceFolder } from '../../../util'
import {
  ExperimentsData,
  QUEUED_EXPERIMENT_PATH
} from '../../../../experiments/data'
import * as Watcher from '../../../../fileSystem/watcher'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../../../../commands/internal'
import { buildExperimentsData, buildExperimentsDataDependencies } from '../util'
import { ExperimentFlag } from '../../../../cli/dvc/constants'
import { EXPERIMENTS_GIT_LOGS_REFS } from '../../../../experiments/data/constants'
import { gitPath } from '../../../../cli/git/constants'
import { getGitPath } from '../../../../fileSystem'

suite('Experiments Data Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ExperimentsData', () => {
    it('should debounce all calls to update that are made within 200ms', async () => {
      const { data, mockExperimentShow } = buildExperimentsData(disposable)

      await Promise.all([
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate()
      ])

      expect(mockExperimentShow).to.be.calledOnce
    })

    it('should call the updater function on setup', async () => {
      const { data, mockCreateFileSystemWatcher, mockExperimentShow } =
        buildExperimentsData(disposable)

      await data.isReady()

      expect(mockExperimentShow).to.be.calledOnce
      expect(mockCreateFileSystemWatcher).to.be.calledOnce

      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 0)).to.deep.equal(
        new RelativePattern(
          getTestWorkspaceFolder(),
          join(
            '**',
            `{dvc.lock,dvc.yaml,params.yaml,*.dvc,nested${sep}params.yaml,summary.json}`
          )
        )
      )
    })

    it('should dispose of the current watcher and instantiate a new one if the params files change', async () => {
      const mockNow = getMockNow()

      const {
        internalCommands,
        mockCreateFileSystemWatcher,
        mockExperimentShow
      } = buildExperimentsDataDependencies(disposable)

      const mockDispose = stub()

      mockCreateFileSystemWatcher.callsFake(() => {
        return { dispose: mockDispose } as unknown as FileSystemWatcher
      })

      const data = disposable.track(
        new ExperimentsData(
          dvcDemoPath,
          internalCommands,
          disposable.track(new EventEmitter<boolean>())
        )
      )

      await data.isReady()

      bypassProcessManagerDebounce(mockNow)

      mockExperimentShow.resolves(
        Object.assign(
          { ...expShowFixture },
          {
            workspace: {
              baseline: {
                data: {
                  metrics: {
                    ...expShowFixture.workspace.baseline.data?.metrics,
                    'new_summary.json': {
                      data: { auc: 0, loss: 1 }
                    }
                  },
                  params: {
                    ...expShowFixture.workspace.baseline.data?.params,
                    'new_params.yml': {
                      data: { new_seed: 10000, new_weight_decay: 0 }
                    }
                  }
                }
              }
            }
          }
        )
      )

      const dataUpdatedEvent = new Promise(resolve =>
        data.onDidUpdate(data => resolve(data))
      )

      data.managedUpdate()

      await dataUpdatedEvent

      expect(mockCreateFileSystemWatcher).to.be.calledTwice
      expect(mockDispose).to.be.calledOnce
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 0)).to.deep.equal(
        new RelativePattern(
          getTestWorkspaceFolder(),
          join(
            '**',
            `{dvc.lock,dvc.yaml,params.yaml,*.dvc,nested${sep}params.yaml,summary.json}`
          )
        )
      )
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 1)).to.deep.equal(
        new RelativePattern(
          getTestWorkspaceFolder(),
          join(
            '**',
            `{dvc.lock,dvc.yaml,params.yaml,*.dvc,nested${sep}params.yaml,new_params.yml,new_summary.json,summary.json}`
          )
        )
      )
    })

    it('should watch the .git directory for updates', async () => {
      const mockNow = getMockNow()
      const gitRoot = dvcDemoPath

      const mockExecuteCommand = (command: CommandId) => {
        if (command === AvailableCommands.GIT_GET_REPOSITORY_ROOT) {
          return Promise.resolve(gitRoot)
        }
      }

      const data = disposable.track(
        new ExperimentsData(
          dvcDemoPath,
          {
            dispose: stub(),
            executeCommand: mockExecuteCommand
          } as unknown as InternalCommands,
          disposable.track(new EventEmitter<boolean>())
        )
      )

      await data.isReady()
      bypassProcessManagerDebounce(mockNow)

      const managedUpdateSpy = spy(data, 'managedUpdate')
      const dataUpdatedEvent = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

      await Watcher.fireWatcher(getGitPath(gitRoot, gitPath.DOT_GIT_HEAD))
      await dataUpdatedEvent

      expect(managedUpdateSpy).to.be.called
    })

    it('should not use exp show to fetch git refs external to the workspace if the path is not from a temp workspace', async () => {
      const mockNow = getMockNow()
      const { data, mockExperimentShow } = buildExperimentsData(disposable)

      await data.isReady()
      bypassProcessManagerDebounce(mockNow)
      const mockIsOngoingOrQueued = stubPrivateMemberMethod(
        data,
        'processManager',
        'isOngoingOrQueued'
      ).returns(false)

      mockExperimentShow.resetHistory()

      await data.managedUpdate()

      expect(mockIsOngoingOrQueued).to.be.calledWith('fullUpdate')
      expect(mockExperimentShow).to.be.calledOnce
      expect(mockExperimentShow).to.be.calledWithExactly(
        dvcDemoPath,
        ExperimentFlag.NO_FETCH
      )

      bypassProcessManagerDebounce(mockNow, 2)
      mockExperimentShow.resetHistory()

      await data.managedUpdate(EXPERIMENTS_GIT_LOGS_REFS)

      expect(mockExperimentShow).to.be.calledOnce
      expect(mockExperimentShow).to.be.calledWithExactly(
        dvcDemoPath,
        ExperimentFlag.NO_FETCH
      )
    })

    it('should use exp show to fetch external git refs if the path to a temporary workspace (queued experiment) is provided', async () => {
      const mockNow = getMockNow()
      const { data, mockExperimentShow } = buildExperimentsData(disposable)

      await data.isReady()
      bypassProcessManagerDebounce(mockNow)
      mockExperimentShow.resetHistory()

      await data.managedUpdate(QUEUED_EXPERIMENT_PATH)

      expect(mockExperimentShow).to.be.calledOnce
      expect(mockExperimentShow).to.be.calledWithExactly(dvcDemoPath)
    })
  })
})
