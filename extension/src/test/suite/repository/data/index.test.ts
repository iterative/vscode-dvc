import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { buildRepositoryData } from '../util'
import { Disposable } from '../../../../extension'
import { dvcDemoPath } from '../../../util'
import { fireWatcher } from '../../../../fileSystem/watcher'
import { RepositoryData } from '../../../../repository/data'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../../../../commands/internal'
import { DOT_GIT_HEAD } from '../../../../cli/git/constants'

suite('Repository Data Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('RepositoryData', () => {
    it('should not queue a full update within 200ms of one starting', async () => {
      const dataDir = join('data', 'MNIST', 'raw')
      const {
        data,
        mockDiff,
        mockGetAllUntracked,
        mockListDvcOnlyRecursive,
        mockStatus
      } = await buildRepositoryData(disposable)

      await Promise.all([
        data.managedUpdate(join(dvcDemoPath, 'dvc.lock')),
        data.managedUpdate(join(dvcDemoPath, dataDir) + '.dvc'),
        data.managedUpdate(join(dvcDemoPath, 'dvc.yaml')),
        data.managedUpdate(join(dvcDemoPath, 'dvc.lock')),
        data.managedUpdate(join(dvcDemoPath, dataDir) + '.dvc')
      ])

      expect(mockDiff).to.be.calledOnce
      expect(mockGetAllUntracked).to.be.calledOnce
      expect(mockListDvcOnlyRecursive).to.be.calledOnce
      expect(mockStatus).to.be.calledOnce
    })

    it('should debounce all calls made within 200ms of a full update', async () => {
      const {
        data,
        mockDiff,
        mockGetAllUntracked,
        mockListDvcOnlyRecursive,
        mockStatus
      } = await buildRepositoryData(disposable)

      await Promise.all([
        data.managedUpdate(join(dvcDemoPath, 'dvc.lock')),
        data.managedUpdate(),
        data.managedUpdate(join(dvcDemoPath, 'dvc.yaml')),
        data.managedUpdate()
      ])

      expect(mockDiff).to.be.calledOnce
      expect(mockGetAllUntracked).to.be.calledOnce
      expect(mockListDvcOnlyRecursive).to.be.calledOnce
      expect(mockStatus).to.be.calledOnce
    })

    it('should not queue a partial update within 200ms of one starting', async () => {
      const {
        data,
        mockDiff,
        mockGetAllUntracked,
        mockListDvcOnlyRecursive,
        mockStatus
      } = await buildRepositoryData(disposable)

      const firstUpdate = data.managedUpdate()

      await Promise.all([
        firstUpdate,
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate()
      ])

      expect(mockDiff).to.be.calledOnce
      expect(mockGetAllUntracked).to.be.calledOnce
      expect(mockListDvcOnlyRecursive).not.to.be.called
      expect(mockStatus).to.be.calledOnce
    })

    it('should run a partial update and queue a full update (and send further calls to the full update queue) if they are called in that order', async () => {
      const {
        data,
        mockDiff,
        mockGetAllUntracked,
        mockListDvcOnlyRecursive,
        mockStatus
      } = await buildRepositoryData(disposable)

      const firstUpdate = data.managedUpdate()
      const firstReset = data.managedUpdate(join(dvcDemoPath, 'dvc.lock'))

      await Promise.all([
        firstUpdate,
        firstReset,
        data.managedUpdate(),
        data.managedUpdate(join(dvcDemoPath, 'dvc.lock')),
        data.managedUpdate(),
        data.managedUpdate(join(dvcDemoPath, 'dvc.yaml'))
      ])

      expect(mockGetAllUntracked).to.be.calledTwice
      expect(mockDiff).to.be.calledTwice
      expect(mockListDvcOnlyRecursive).to.be.calledOnce
      expect(mockStatus).to.be.calledTwice
    })

    it('should watch the .git index and HEAD for updates', async () => {
      const gitRoot = resolve(dvcDemoPath, '..')

      const mockExecuteCommand = (command: CommandId) => {
        if (command === AvailableCommands.GIT_GET_REPOSITORY_ROOT) {
          return Promise.resolve(gitRoot)
        }
      }

      const data = disposable.track(
        new RepositoryData(
          dvcDemoPath,
          {
            dispose: stub(),
            executeCommand: mockExecuteCommand
          } as unknown as InternalCommands,
          disposable.track(new EventEmitter())
        )
      )
      await data.isReady()

      const managedUpdateSpy = spy(data, 'managedUpdate')
      const dataUpdatedEvent = new Promise(resolve =>
        data.onDidUpdate(() => resolve(undefined))
      )

      await fireWatcher(join(gitRoot, DOT_GIT_HEAD))
      await dataUpdatedEvent

      expect(managedUpdateSpy).to.be.called
    })
  })
})
