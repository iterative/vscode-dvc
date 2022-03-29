import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, stub } from 'sinon'
import { EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ProcessManager } from '../../processManager'
import { delay } from '../../util/time'

suite('Process Manager Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('ProcessManager', () => {
    it('should manage calls to a process', async () => {
      const mockRefresh = stub()
      const processManager = disposable.track(
        new ProcessManager(new EventEmitter(), {
          name: 'refresh',
          process: mockRefresh
        })
      )

      mockRefresh.onFirstCall().callsFake(async () => {
        await delay(500)
        return 'I always run.'
      })

      for (let i = 1; i <= 3; i++) {
        mockRefresh
          .onCall(i)
          .resolves(
            'I go into the void.' +
              'Any calls made within 200ms of the first call get debounced.'
          )
      }

      mockRefresh
        .onCall(4)
        .resolves(
          'I am the lucky one.' +
            'After 200ms the next call will be sent to the queue ' +
            'it will be executed after the first call finishes'
        )

      for (let i = 5; i <= 6; i++) {
        mockRefresh
          .onCall(i)
          .resolves(
            'I also go into the void.' +
              'Any calls subsequent calls made once an item is in the queue ' +
              'do not need to be run. ' +
              'We only need a queue of size 1.'
          )
      }

      const firstCall = processManager.run('refresh')

      await Promise.all([
        processManager.run('refresh'),
        processManager.run('refresh'),
        processManager.run('refresh')
      ])

      expect(
        mockRefresh,
        'should debounce all calls made within 200ms of the first'
      ).to.be.calledOnce
      await delay(250)

      await Promise.all([
        processManager.run('refresh'),
        processManager.run('refresh'),
        processManager.run('refresh')
      ])

      await firstCall

      expect(mockRefresh, 'should queue the next call made after 200ms').to.be
        .calledTwice
    })

    it('should send all calls to the queue when processes are paused', async () => {
      const mockUpdate = stub()
      const processesPaused = disposable.track(new EventEmitter<boolean>())
      const processManager = disposable.track(
        new ProcessManager(processesPaused, {
          name: 'update',
          process: mockUpdate
        })
      )
      processesPaused.fire(true)

      await Promise.all([
        processManager.run('update'),
        processManager.run('update'),
        processManager.run('update'),
        processManager.run('update')
      ])

      expect(
        mockUpdate,
        'should send all calls to the queue when processes are paused'
      ).not.to.be.called

      const onDidUnpauseProcesses = processesPaused.event

      const updatesRestartedEvent = new Promise(resolve =>
        disposable.track(onDidUnpauseProcesses(paused => resolve(paused)))
      )
      processesPaused.fire(false)

      expect(await updatesRestartedEvent).to.be.false
      expect(mockUpdate, 'the queue is flushed on restart').to.be.calledOnce
    })

    it('should empty the queue with forceRunQueued even if all processes are paused', async () => {
      const mockPartialUpdate = stub()
      const mockFullUpdate = stub()
      const processesPaused = disposable.track(new EventEmitter<boolean>())
      const processManager = disposable.track(
        new ProcessManager(
          processesPaused,
          {
            name: 'partialUpdate',
            process: mockPartialUpdate
          },
          {
            name: 'fullUpdate',
            process: mockFullUpdate
          }
        )
      )
      processesPaused.fire(true)

      await Promise.all([
        processManager.run('partialUpdate'),
        processManager.run('fullUpdate'),
        processManager.run('partialUpdate'),
        processManager.run('fullUpdate'),
        processManager.run('partialUpdate'),
        processManager.run('fullUpdate')
      ])

      expect(mockPartialUpdate, 'all calls are sent to the queue').not.to.be
        .called
      expect(mockFullUpdate).not.to.be.called

      await processManager.forceRunQueued()

      expect(
        mockPartialUpdate,
        'the queue is flushed when forceRunQueued is called'
      ).to.be.calledOnce
      expect(mockFullUpdate).to.be.calledOnce
    })
  })
})
