import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { buildRepositoryData } from '../util'
import { Disposable } from '../../../../extension'
import { dvcDemoPath } from '../../../util'
import { fireWatcher } from '../../../../fileSystem/watcher'
import { DOT_GIT_HEAD, getGitRepositoryRoot } from '../../../../git'
import { RepositoryData } from '../../../../repository/data'
import { InternalCommands } from '../../../../commands/internal'

suite('Repository Data Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('RepositoryData', () => {
    it('should not queue an update within 200ms of one starting', async () => {
      const { data, mockDataStatus } = await buildRepositoryData(disposable)

      await Promise.all([
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate(),
        data.managedUpdate()
      ])

      expect(mockDataStatus).to.be.calledOnce
    })

    it('should watch the .git index and HEAD for updates', async () => {
      const data = disposable.track(
        new RepositoryData(
          dvcDemoPath,
          {
            dispose: stub(),
            executeCommand: stub()
          } as unknown as InternalCommands,
          disposable.track(new EventEmitter())
        )
      )
      await data.isReady()

      const gitRoot = await getGitRepositoryRoot(dvcDemoPath)

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
