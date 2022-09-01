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
