import { join, sep } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { EventEmitter, FileSystemWatcher } from 'vscode'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import { Disposable, Disposer } from '../../../../extension'
import expShowFixture from '../../../fixtures/expShow/output'
import {
  buildInternalCommands,
  bypassProcessManagerDebounce,
  getFirstArgOfCall,
  getMockNow,
  mockDisposable
} from '../../util'
import { dvcDemoPath } from '../../../util'
import { ExperimentsData } from '../../../../experiments/data'
import * as Watcher from '../../../../fileSystem/watcher'
import { DOT_GIT_HEAD, getGitRepositoryRoot } from '../../../../git'
import { InternalCommands } from '../../../../commands/internal'

suite('Experiments Data Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  const buildDependencies = (disposer: Disposer) => {
    const mockCreateFileSystemWatcher = stub(
      Watcher,
      'createFileSystemWatcher'
    ).returns(mockDisposable)

    const { cliReader, internalCommands } = buildInternalCommands(disposer)
    const mockExperimentShow = stub(cliReader, 'experimentShow').resolves(
      expShowFixture
    )
    return { internalCommands, mockCreateFileSystemWatcher, mockExperimentShow }
  }

  const buildExperimentsData = (disposer: Disposer) => {
    const {
      internalCommands,
      mockExperimentShow,
      mockCreateFileSystemWatcher
    } = buildDependencies(disposer)

    const data = disposer.track(
      new ExperimentsData(
        dvcDemoPath,
        internalCommands,
        disposer.track(new EventEmitter<boolean>())
      )
    )

    return { data, mockCreateFileSystemWatcher, mockExperimentShow }
  }

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

      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 0)).to.equal(
        join(
          dvcDemoPath,
          '**',
          `{dvc.lock,dvc.yaml,params.yaml,nested${sep}params.yaml,summary.json}`
        )
      )
    })

    it('should dispose of the current watcher and instantiate a new one if the params files change', async () => {
      const mockNow = getMockNow()

      const {
        internalCommands,
        mockCreateFileSystemWatcher,
        mockExperimentShow
      } = buildDependencies(disposable)

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
                    ...(expShowFixture.workspace.baseline.data?.metrics || {}),
                    'new_summary.json': {
                      data: { auc: 0, loss: 1 }
                    }
                  },
                  params: {
                    ...(expShowFixture.workspace.baseline.data?.params || {}),
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
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 0)).to.equal(
        join(
          dvcDemoPath,
          '**',
          `{dvc.lock,dvc.yaml,params.yaml,nested${sep}params.yaml,summary.json}`
        )
      )
      expect(getFirstArgOfCall(mockCreateFileSystemWatcher, 1)).to.equal(
        join(
          dvcDemoPath,
          '**',
          `{dvc.lock,dvc.yaml,params.yaml,nested${sep}params.yaml,new_params.yml,new_summary.json,summary.json}`
        )
      )
    })

    it('should watch the .git directory for updates', async () => {
      const mockNow = getMockNow()

      const data = disposable.track(
        new ExperimentsData(
          dvcDemoPath,
          {
            dispose: stub(),
            executeCommand: stub()
          } as unknown as InternalCommands,
          disposable.track(new EventEmitter<boolean>())
        )
      )

      await data.isReady()
      bypassProcessManagerDebounce(mockNow)

      const gitRoot = await getGitRepositoryRoot(dvcDemoPath)

      const managedUpdateSpy = spy(data, 'managedUpdate')
      const dataUpdatedEvent = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

      await Watcher.fireWatcher(join(gitRoot, DOT_GIT_HEAD))
      await dataUpdatedEvent

      expect(managedUpdateSpy).to.be.called
    })
  })
})
