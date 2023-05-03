import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, stub } from 'sinon'
import { Disposable } from '../../../extension'
import { ProcessManager } from '../../../process/manager'
import { delay } from '../../../util/time'

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
        new ProcessManager({
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
  })
})
